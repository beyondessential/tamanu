const importSurveys = require('./importSurveys');

// . Gestational Diabetes, Pregnancy Outcomes, Postnatal FollowUp surveillance, Child Follow-Up Surveillance

const res = importSurveys({
  reqQuery: {
    surveyNames: 'Antenatal Visit'
  },
  filePath: './GDM_surveys.xlsx'
});
