const importSurveys = require('../surveys_import/importSurveys');

module.exports = (database) => {
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
    importSurveys(database, `${__dirname}/../surveys_import/data/GDM_surveys.xlsx`, pregnancyProgram);
  });
}
