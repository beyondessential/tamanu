const importSurveys = require('../surveys_import/importSurveys');

module.exports = async (database) => {
  const pregnancyProgram = {
    _id: 'program-pregnancy',
    name: 'Pregnancy',
    programType: 'pregnancy',
    collection: 'pregnancies',
    label: '<%= moment(conceiveDate).format(dateFormat) %> - <%= outcome %>',
    value: '_id',
    patientFilters: '{ "sex": "female" }'
  };

  database.write(() => database.create('program', pregnancyProgram, true));

  await importSurveys(database, `${__dirname}/../surveys_import/data/GDM_surveys.xlsx`);
}
