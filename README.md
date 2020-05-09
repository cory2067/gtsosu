# GTS Web

## Running in development

First obtain a `.env` file from `Cychloryn#1321`. This file contains secret information like API keys and database credentials.
Place the `.env` in the root directory of this repository.

```bash
npm install # install dependencies

# run these two commands in separate terminals
npm run hotloader # run react hotloader
npm start         # start the backend
```

The website will be live at http://localhost:5000 and will auto-reload if you modify the code.

If you're running in Windows CMD, `npm start` may fail. In that case, try running `npx nodemon` instead.

## Deploying updates

The site is hosted on Heroku and is live at https://gtsosu.com. Currently, Heroku automatically deploys from `master`, so it's critical to ensure that there's no broken code on `master`.

## Translations

Translations are handled by the `ContentManager.js` module. The `ContentManager` is a simple utility that reads various json files from the `client/src/content` directory. A user's selected language is not tied to their account, but is persisted in the browser's local storage.

### Adding a new tourney translation

Add a new file to `client/src/content` with the following name: `tourney-language.js`. (e.g. `igts-en.js`, `egts-fr.js`).

Then, add a selectable option for this language in the navbar if needed. In the `TourneyNavbar` found at `client/src/components/modules/Navbar.js`, add a `Menu.Item` for the new language, following the same pattern as the othe languages. (I may change this process later to be a little prettier)

### Adding a new UI translation

UI translations are used for parts of the site that do not vary from tournament tournament (e.g. the navbar, the register button, etc). All UI translation are found in `client/src/content/ui.js`. This file contains a mapping from language codes to a dictionary of various terms and their respective translations.

New terms can be added to this dictionary at will. To use these translations, they can be imported as follows:

```js
// fetch the translated UI from the content manager
import ContentManager from "../../ContentManager";
const UI = ContentManager.getUI();

class TestComponent extends Component {
  render() {
    // displays "register" in whatever the current language is
    return <div>{UI.register}</div>;
  }
}
```

##
