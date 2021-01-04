// responsible for loading content on the pages and managing language
// lazily loads data, and then caches it
import UI from "./content/ui";

const _data = {};

export default {
  setLanguage: (lang) => {
    localStorage.setItem("lang", lang);
    location.reload(); // eh this is tolerable
  },

  // returns a promise for the content
  // 'target' is either 'home' or the code for a tournament
  get: async (_target) => {
    const target = _target.split("-")[0]; // discard division names
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
