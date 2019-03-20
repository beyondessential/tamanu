import { toUpper } from 'lodash';
import shortid from 'shortid';
import xlsx from 'xlsx';
import fs from 'fs';
const fileToImport = __dirname + '/data/diagnoses.xlsx';
const modelName = 'diagnosis';

export default (database) => {
  if (!fs.existsSync(fileToImport)) {
    console.log('Skipping diagnosis import');
    return;
  }

  const workbook = xlsx.readFile(fileToImport);
  const entries = Object.entries(workbook.Sheets);
  database.write(() => {
    entries.forEach(([tabName, sheet]) => {
      const diagnoses = xlsx.utils.sheet_to_json(sheet);

      diagnoses.forEach((diagnosis) => {
        const { General: codeSegment1, COD: codeSegment2, 'Diagnostic Term': name } = diagnosis;
        const diagnosisObject = database.findOne(modelName, name, 'name');
        if (!diagnosisObject || diagnosisObject.length <= 0) {
          database.create(modelName, {
            _id: shortid.generate(),
            name,
            code: toUpper(`${codeSegment1}-${codeSegment2}`)
          }, true);
        }
      });
    });
  });
}
