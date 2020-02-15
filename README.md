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

The website will be live at http://localhost:5000 and will auto-reload if you modify the code
