const { toUpper } = require('lodash');
const shortid = require('shortid');
const Realm = require('realm');
const xlsx = require('xlsx');
const { schemas, version: schemaVersion } = require('../../shared/schemas');

const database = new Realm({
  path: '../../lan/data/main.realm',
  schema: schemas,
  schemaVersion,
});

const fileToImport = './data/diagnosis_list.xls';
const workbook = xlsx.readFile(fileToImport);
const entries = Object.entries(workbook.Sheets);

entries.forEach(async (surveySheets) => {
  const [tabName, sheet] = surveySheets;
  const diagnoses = xlsx.utils.sheet_to_json(sheet);
  console.log(`Importing ${tabName}`);

  try {
    database.write(() => {
      diagnoses.forEach((diagnosis) => {
        const { General: codeSegment1, COD: codeSegment2, 'Diagnostic Term': name } = diagnosis;
        const object = {
          _id: shortid.generate(),
          name,
          code: toUpper(`${codeSegment1}-${codeSegment2}`)
        };

        const change = {
          _id: shortid.generate(),
          action: 'save',
          recordId: object._id,
          recordType: 'diagnosisList',
          timestamp: new Date().getTime()
        };

        database.create('diagnosisList', object, true);
        database.create('change', change, true);
        console.log('DiagnosisList item added!');
      });
    });
  } catch (err) {
    console.error('Error: ', err);
  }
});

console.log('Terminated!');
process.exit();
