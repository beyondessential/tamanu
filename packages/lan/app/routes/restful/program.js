import express from 'express';

export const programRoutes = express.Router();

programRoutes.post('/program', (req, res) => {
  // import a program
});

programRoutes.put('/program/:programId', (req, res) => {
  // update a program
});

const DUMMY_SURVEY = {
  screens: [
    [ { code: 'TamanuProgramsTest1',
      text:
       'Please enter all data accurately to determine if this patient has risk factors for COVID-19',
      type: 'Instruction',
      newScreen: true } ],
    [ { code: 'TamanuProgramsTest2',
      text:
       'Please ensure all basic patient demographics including Sex and Date of Birth have been updated in the Patient Details section. These do not need to be entered here.',
      type: 'Instruction',
      newScreen: true },
    { code: 'TamanuProgramsTest3',
      text: 'Please enter today\'s date',
      type: 'Date',
      newScreen: false },
    { code: 'TamanuProgramsTest4',
      text: 'What is your name? ',
      type: 'FreeText',
      newScreen: false },
    { code: 'TamanuProgramsTest5',
      text: 'What is your position title',
      type: 'Radio',
      newScreen: false },
    { code: 'TamanuProgramsTest6',
      text: 'Which village is the patient currently living in?',
      type: 'Radio',
      newScreen: false },
    { code: 'TamanuProgramsTest7',
      text:
       'Has the patient had recent contact with a confirmed COVID-19 patient?',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest8',
      text: 'Has the patient recently travelled internationally?',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest9',
      text:
       'Which country/countries has the patient travelled to in the last 21 days?',
      type: 'FreeText',
      newScreen: false },
    { code: 'TamanuProgramsTest10',
      text:
       'Has the patient has close contact with a recent international traveller',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest11',
      text: 'Is the patient >70 years of age',
      type: 'Binary',
      newScreen: false } ],
  [ { code: 'TamanuProgramsTest12',
      text: 'Does the patient have any of the following conditions:',
      type: 'Instruction',
      newScreen: true },
    { code: 'TamanuProgramsTest13',
      text: 'Cardiovascular disease',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest12',
      text: 'Diabetes',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest13',
      text: 'Auto-immune condition such as Lupus or MS',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest14',
      text: 'Is the patient immuno-compromised for any reason?',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest15',
      text:
       'Is this due to an ongoing condition or current drug therapy',
      type: 'Checkbox',
      newScreen: false },
    { code: 'TamanuProgramsTest16',
      text: 'Does the patient have cancer',
      type: 'Binary',
      newScreen: false },
    { code: 'TamanuProgramsTest17',
      text:
       'Does the patient have a seriously life-threatening or terminal illness',
      type: 'Binary',
      newScreen: false } ] 
  ]
};

programRoutes.get('/survey/:surveyId', (req, res) => {
  // get a survey definition
  const { db, params } = req;
  const { surveyId } = params;

  // const survey = db.object('survey');
  //
  res.send(DUMMY_SURVEY);
});

programRoutes.post('/survey/:surveyId', (req, res) => {
  // submit a new survey response
  const { db, body, params } = req;
  const { surveyId } = params;
  const { patientId, date, startTime, endTime, answers } = body;

  // answers in the form of { [questionCode]: answer }
  const answerArray = Object.entries(answers).map(([questionCode, answer]) => ({
    questionId,
    body: answer,
  }));

  db.write(() => {
    // write survey response and all answers
    // const surveyResponse = db.create('surveyResponse', surveyResponseData);
  });
});


