// responsible for loading content on the pages and managing language
// lazily loads data, and then caches it
import UI from "./content/ui";
import { tokenizeTourney } from "./utilities";

const _data = {};

export default {
  getLanguage: () => localStorage.getItem("lang") || "en",

  setLanguage: (lang) => {
    localStorage.setItem("lang", lang);
    location.reload(); // eh this is tolerable
  },

  // returns a promise for the content
  get: async (tourney) => {
    // chop off division names, e.g. cgts-4v4_2020 -> cgts_2020
    const { code, year } = tokenizeTourney(tourney);
    const target = `${code}_${year}`;

    const lang = localStorage.getItem("lang") || "en";

    if (_data[target]) {
      return _data[target];
    }

    console.log(`Fetching data for ${target}-${lang}`);
    const content = await import(`./content/${target}-${lang}`)
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

    _data[target] = content;
    return content;
  },

  getUI: () => {
    const lang = localStorage.getItem("lang") || "en";
    return UI[lang] || UI["en"];
  },
};
