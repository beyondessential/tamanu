import express from 'express';
import { Form } from 'multiparty';
import { generate } from 'shortid';

import { readSurveyXSLX, writeProgramToDatabase } from '../../surveyImporter';
import { objectToJSON } from '../../utils';

export const programRoutes = express.Router();

function parseFileUpload(req) {
  // import a program
  const form = new Form();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ ...fields, ...files });
    });
  });
}

programRoutes.post('/program', async (req, res) => {
  const { file } = await parseFileUpload(req);
  // file upload fields inherently support multiple files
  // so just get the first one
  const { path } = file[0];
  try {
    const data = readSurveyXSLX(path);
    const program = writeProgramToDatabase(req.db, data);
    res.send({ programId: program._id });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

programRoutes.get('/program/:programId', (req, res) => {
  // get program details and list of available surveys
  const { db, params } = req;
  const { programId } = params;

  const program = db.objectForPrimaryKey('program', programId);

  if (!program) {
    res.status(404).send(null);
    return;
  }

  res.send({
    _id: program._id,
    name: program.name,
    surveys: program.surveys.map(s => ({
      _id: s._id,
      name: s.name,
      code: s.code,
    })),
  });
});

programRoutes.put('/program/:programId', (req, res) => {
  // TODO: update a program
});

function parseQuestionOptions({ options, optionLabels }) {
  if (!options) {
    return null;
  }

  try {
    const optionValues = JSON.parse(options);
    const optionLabelValues = JSON.parse(optionLabels || '[]');
    return optionValues.map((option, i) => ({
      value: option,
      label: optionLabelValues[i] || option,
    }));
  } catch (e) {
    return null;
  }
}

programRoutes.get('/survey/:surveyId', (req, res) => {
  // get a survey definition
  const { db, params } = req;
  const { surveyId } = params;

  const survey = db.objectForPrimaryKey('survey', surveyId);

  if (!survey) {
    res.status(404).send(null);
    return;
  }

  const serialiseComponent = c => {
    const question = c.questions[0];
    return {
      _id: c._id,
      qid: question._id,
      type: question.type,
      text: question.text,
      code: question.code,
      options: parseQuestionOptions(question),
    };
  };

  const serialiseScreen = s => ({
    _id: s._id,
    questions: s.components.map(serialiseComponent),
  });

  res.send({
    _id: survey._id,
    name: survey.name,
    code: survey.code,
    screens: survey.screens.map(serialiseScreen),
  });
});

function getVisitForSurvey(db, patientId, visitId, surveyResponse) {
  if (visitId) {
    return db.objectForPrimaryKey('visit', visitId);
  }

  // no visit specified - see if patient has an open visit we can use
  const patient = db.objectForPrimaryKey('patient', patientId);

  const existingVisit = patient.visits.find(x => !x.endDate);
  if (existingVisit) {
    return existingVisit;
  }

  // otherwise, create a new visit
  const newVisit = db.create('visit', {
    _id: generate(),
    visitType: 'surveyResponse',
    startDate: surveyResponse.startTime,
    endDate: surveyResponse.endTime,

    location: db.objects('location')[0],
    department: db.objects('department')[0],
  });

  patient.visits = [...patient.visits, newVisit];

  return newVisit;
}

programRoutes.post('/surveyResponse', (req, res) => {
  // submit a new survey response
  const { db, body, user } = req;
  const {
    patientId,
    visitId,
    surveyId,
    date,
    startTime,
    endTime,
    answers,
  } = body;

  // answers arrive in the form of { [questionCode]: answer }
  const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
    _id: generate(),
    type: 'answer',
    questionId,
    body: `${answer}`,
  }));

  db.write(() => {
    const surveyResponse = db.create('surveyResponse', {
      _id: generate(),
      surveyId: surveyId,
      assessorId: '???',
      startTime,
      endTime,
      answers: answerArray,
    });

    const visit = getVisitForSurvey(db, patientId, visitId, surveyResponse);

    visit.surveyResponses = [...visit.surveyResponses, surveyResponse];

    res.send(objectToJSON(surveyResponse));
  });
});
