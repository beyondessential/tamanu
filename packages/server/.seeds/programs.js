import fs from 'fs';
import importSurveys from '../surveys_import/importSurveys';
const surveysImportFile = `${__dirname}/../surveys_import/data/GDM_surveys.xlsx`;

export default (database) => {
  const pregnancyProgramDetails = {
    _id: 'program-pregnancy',
    name: 'Pregnancy',
    programType: 'pregnancy',
    collection: 'pregnancies',
    label: '<%= moment(conceiveDate).format(dateFormat) %> - <%= outcome %>',
    value: '_id',
    patientFilters: '{ "sex": "female" }'
  };

  database.write(() => {
    const pregnancyProgram = database.create('program', pregnancyProgramDetails, true);
    if (fs.existsSync(surveysImportFile)) {
      importSurveys(database, surveysImportFile, pregnancyProgram);
    }
  });
}
