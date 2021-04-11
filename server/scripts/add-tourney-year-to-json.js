/**
 * Single use script 4/11
 * Appends tourney year to all of the tourney json files
 */

const fs = require("fs");

function updateTourney(tourney) {
  if (tourney.includes("cgts")) {
    return `${tourney}_2021`;
  }
  return `${tourney}_2020`;
}

async function main() {
  const dir = "client/src/content";
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.includes("gts")) continue;

    const [rawName, ext] = file.split(".");
    const [name, lang] = rawName.split("-");
    if (file.includes("cgts")) {
      fs.renameSync(`${dir}/${file}`, `${dir}/${name}_2021-${lang}.${ext}`);
    } else {
      fs.renameSync(`${dir}/${file}`, `${dir}/${name}_2020-${lang}.${ext}`);
    }
  }
}

main().then(() => console.log("Done"));
