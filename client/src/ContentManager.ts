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

  onLanguageSet(callback: (lang: string) => void) {
    this.languageSetCallback = callback;
  }

  public getLanguage() {
    return this.currentLang;
  }

  public setLanguage(lang?: string) {
    console.log({ lang });

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
