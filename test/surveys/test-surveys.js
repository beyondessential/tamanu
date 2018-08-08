const importSurveys = require('./importSurveys');

const res = importSurveys({
  reqQuery: {
    surveyNames: 'Antenatal Visit, Gestational Diabetes, Pregnancy Outcomes, Postnatal FollowUp surveillance, Child Follow-Up Surveillance'
  },
  filePath: './GDM_survey.xlsx'
});
