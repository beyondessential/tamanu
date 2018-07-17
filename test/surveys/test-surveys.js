const importSurveys = require('./importSurveys');

const res = importSurveys({
  reqQuery: {
    surveyNames: 'Antibiotic Audit'
  },
  filePath: './survey.xlsx'
});