import express from 'express';
import { Form } from 'multiparty';
import { generate } from 'shortid';

import { readSurveyXSLX, writeProgramToDatabase, writeSurveyToDatabase } from '../../surveyImporter';
import { objectToJSON } from '../../utils';

export const programRoutes = express.Router();

function parseFormData(req) {
  // import a program
  const form = new Form();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      // a formdata submission allows for multiple values for the
      // same key, so everything will be an array - this doesn't match
      // with the json-oriented way of doing things so just take the 
      // first element of everything
      const allFields = { ...fields, ...files };
      const prunedFields = {};
      Object.entries(allFields).map(([key, value]) => {
        prunedFields[key] = value && value[0];
      });
      resolve(prunedFields);
    });
  });
}

programRoutes.post('/program', async (req, res) => {
  const { db } = req;
  const { 
    file,
    programName,
    surveyName,
  } = await parseFormData(req);

  try {
    const surveyData = readSurveyXSLX(surveyName, file.path);
    db.write(() => {
      const program = writeProgramToDatabase(req.db, {
        name: programName
      });

      const survey = writeSurveyToDatabase(req.db, program, surveyData);

      res.send({ 
        program: {
          _id: program._id,
          name: program.name,
        },
        survey: {
          _id: survey._id,
          name: survey.name,
        },
      });
    });
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
      visibilityCriteria: question.visibilityCriteria,
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
  const { patientId, visitId, surveyId, date, startTime, endTime, answers } = body;

  // answers arrive in the form of { [questionCode]: answer }
  const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
    _id: generate(),
    type: 'answer',
    questionId,
    body: `${answer}`,
  }));

  const survey = db.objectForPrimaryKey('survey', surveyId);

  db.write(() => {
    const surveyResponse = db.create('surveyResponse', {
      _id: generate(),
      survey,
      assessor: req.user,
      startTime,
      endTime,
      answers: answerArray,
    });

    const visit = getVisitForSurvey(db, patientId, visitId, surveyResponse);

    visit.surveyResponses = [...visit.surveyResponses, surveyResponse];

    res.send(objectToJSON(surveyResponse));
  });
});
