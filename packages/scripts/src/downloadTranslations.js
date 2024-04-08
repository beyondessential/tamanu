const { writeFile } = require('fs');
const GoogleSpreadsheet = require('google-spreadsheet');

const creds = require('../config/bes-tools-key.json');

const OMIT_COLUMNS = [
  // for clerical use only
  'id',
  'section',
  'note',

  // google doc utils
  'save',
  'del',
  'app:edited',
  '_links',
  '_xml',
];

const BASE_PATH = process.argv[2] || '.';
const DOC_ID = '10CIUe83xHRUUycwPJEwlQJaMsGWRkMydBy3zE-6D5y0';
const doc = new GoogleSpreadsheet(DOC_ID);

const log = console.log;

function login() {
  log('Logging in...');
  return new Promise(resolve => {
    doc.useServiceAccountAuth(creds, resolve);
  });
}

function getWorksheets() {
  log('Getting worksheets...');
  return new Promise((resolve, reject) => {
    doc.getInfo((err, info) => {
      if (err) reject(err);
      else resolve(info.worksheets);
    });
  });
}

function getRows(sheet) {
  return new Promise((resolve, reject) => {
    sheet.getRows((err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function processSheet(sheet) {
  log('Processing sheet', sheet.title);

  // get all rows and check which languages we have
  const rows = await getRows(sheet);
  const keys = Object.keys(rows[0]).filter(k => !OMIT_COLUMNS.includes(k));
  const translations = keys.reduce((obj, k) => ({ ...obj, [k]: {} }), {});

  // put all languages into their own key-value pair object
  rows
    .filter(row => row.id)
    .map(row => {
      keys.map(key => {
        const value = row[key];
        if (value) {
          translations[key][row.id] = value;
        }
      });
    });

  // write each translation to disk
  const writeTasks = keys.map(k => {
    const sanitisedName = sheet.title.toLowerCase().replace(/\W+/g, '');
    const filename = `${sanitisedName}-${k}.json`;
    const path = [BASE_PATH, filename].join('/');

    // pretty-print json to avoid ridiculous diffs
    const data = JSON.stringify(translations[k], null, 2);

    log('Writing', path);
    return new Promise((resolve, reject) => {
      writeFile(path, data, err => (err ? reject(err) : resolve()));
    });
  });

  return Promise.all(writeTasks);
}

async function run() {
  await login();
  const sheets = await getWorksheets();

  const sheetTasks = sheets.map(processSheet);
  await Promise.all(sheetTasks);
}

try {
  run();
} catch (e) {
  console.log(e);
}
