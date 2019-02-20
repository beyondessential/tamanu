module.exports = (database) => {
  const pregnancyProgram = {
    _id: 'program-pregnancy',
    name: 'Pregnancy',
    programType: 'pregnancy',
    collection: 'pregnancies',
    label: '<%= moment(conceiveDate).format(dateFormat) %> - <%= outcome %>',
    value: '_id',
    patientFilters: '{ "sex": "female" }'
  };

  database.create('program', pregnancyProgram, true);
}
