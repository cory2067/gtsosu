// responsible for loading content on the pages and managing language
// lazily loads data, and then caches it
import { createContext } from "react";
import UI from "./content/ui";
import { tokenizeTourney } from "./utilities";

const _data = {};

export const LanguageContext = createContext("en");
/**
 * Refactored content manager to allow state updating
 */
class ContentManager {
  private currentLang = localStorage.getItem("lang") ?? "en";
  private languageSetCallback?: (lang: string) => void;

  /**
   * Listen to language changes. Calling this multiple times will overwrite
   * previous calls
   */
  onLanguageSet(callback: (lang: string) => void) {
    this.languageSetCallback = callback;
  }

  public getLanguage() {
    return this.currentLang;
  }

  public setLanguage(lang?: string) {
    lang ??= "en";

    localStorage.setItem("lang", lang);
    this.currentLang = lang;

    if (this.languageSetCallback) {
      this.languageSetCallback(lang);
    }
  }

  /**
   * Get localized UI object
   *
   * @param lang Should be retrieved from useContext(LanguageContext)
   * @returns Localized string if found. English string or the key itself otherwise.
   */
  getLocalizedUI(lang: string) {
    return UI[lang] ?? UI["en"];
  }

  /**
   * Get a value from object by key. Nested keys are separated by dots
   */
  private getByKey(object: any, key: string) {
    const keyTokens = key.split(".");
    let result = object;
    for (const token of keyTokens) {
      result = result[token];
    }
    return result;
  }

  /**
   * Retrieves the localized string for a given language and key. Fallsback to
   * English first and then the key itself if not found.
   *
   * @param {string} lang - The language code for the desired localization.
   * @param {string} key - The key to lookup the localized string.
   * @return {string} The localized string for the given language and key.
   */
  getLocalizedString(lang: string, key: string) {
    return (
      this.getByKey(this.getLocalizedUI(lang), key) ??
      this.getByKey(this.getLocalizedUI("en"), key) ??
      key
    );
  }

  // returns a promise for the content
  async getLocalizedTourney(tourney: string, lang: string) {
    // chop off division names, e.g. cgts-4v4_2020 -> cgts_2020
    const { code, year } = tokenizeTourney(tourney);
    const target = `${code}_${year}`;
    const targetWithLang = `${target}-${lang}`;

    if (_data[targetWithLang]) {
      return _data[targetWithLang];
    }

    console.log(`Fetching data for ${targetWithLang}`);
    const content = await import(`./content/${targetWithLang}`)
      .catch((e) => {
        if (lang !== "en") {
          console.log(`Data load failed, falling back to english`);
          return import(`./content/${target}-en`);
        }
        throw e;
      })
      .then((file) => file.default)
      .catch((e) => {
        console.log(`Data load failed: ${e}`);
        return null;
      });

    _data[targetWithLang] = content;
    return content;
  }
}

export const contentManager: ContentManager = new ContentManager();
