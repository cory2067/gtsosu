# GTS Web

## Running in development

To run gtsosu, you'll first need to install `nodejs` version 16.

### Running only the frontend

If you're just adding a new tournament and want to verify that everything looks right, the setup is simple and you don't need any special credentials.

Open a terminal in the gtsosu directory and run the following:

```bash
npm install
npm run hotloader
```

The website will be live at http://localhost:5000 but only the "Home" and "Rules" tabs of the tourney will work and you won't be able to login.

### Running the full website

First obtain a `.env` file from `Cychloryn#1321`. This file contains credentials that are used to communicate with the database and the osu! api. The database you'll be using isn't the actual database running on gtsosu.com, but an blank copy that you can play around with. For the security of the website, I won't distribute the credentials for the actual database.

Place the `.env` in the root directory of this repository. In the file, there will be a line that says `OSU_API_KEY=`. You'll need to paste your osu! API key there, or else many features won't work.

Then, open a terminal in the gtsosu directory and run the following:

```bash
npm install # install dependencies

# run these two commands in separate terminals
npm run hotloader # start the frontend
npm start         # start the backend
```

The website will be live at http://localhost:5000 and will auto-reload if you modify the code.

If you're running in Windows CMD, `npm start` may fail. In that case, try running `npx nodemon` instead.

### Testing permissions in development

In development, sometimes you'll want to have admin permissions (to set up new tourneys, or test addding pools/schedules, etc) but sometimes you'll want to be a regular user (to make sure the player experience is correct). By default, you'll be an admin, but you can change this in the .env file.

There should be a line `DEV_ADMIN=true`. To become a regular user, change this to `DEV_ADMIN=false`. Then, restart the terminal running the backend and log out and back in again.

## Deploying updates

The site is hosted on Heroku and is live at https://gtsosu.com. Currently, Heroku automatically deploys from `master`, so it's critical to ensure that there's no broken code on `master`. **Test all changes before pushing, or else the whole website could go down.**

## Adding a new tournament

Add a new file to `client/src/content` with the following name: `tourney_year-en.js`. (e.g. `igts_2020-en.js`). You can copy an existing tourney's js file as a template.

Next, update the home page, which is `home-en.js`. Add a new entry for the new tourney. In the home page config, you can optionally specify `divisions` which behave as independent tournaments, except they share the same `tourney_year-en.js` file. (see cgts for an example)

Next, specify the current year for the tournament in `year-config.js`. This is required so that when a user navigates to `/tourney/home`, it knows which year of the tourney to open by default. Old iterations of the tourney can be accessed by explicitly including the year in the url, such as `/2020/agts/home`.

Now, you should be able to view your new tournament. Configure the settings (e.g. rank restrictions) by clicking the pencil icon next to the tourney name.

Finally, add translations as specified below.

## Translations

Translations are handled by the `ContentManager.js` module. The `ContentManager` is a simple utility that reads various json files from the `client/src/content` directory. A user's selected language is not tied to their account, but is persisted in the browser's local storage.

### Adding a new tourney translation

Add a new file to `client/src/content` with the following name: `tourney_year-language.js`. (e.g. `igts_2020-ja.js`, `egts_2020-fr.js`).

The "Languages" dropdown for each tourney should automatically populate based on the translation files you've added.

### Adding a new UI translation

UI translations are used for parts of the site that do not vary from tournament to tournament (e.g. the navbar, the register button, etc). All UI translation are found in `client/src/content/ui.js`. This file contains a mapping from language codes to a dictionary of various terms and their respective translations.

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
