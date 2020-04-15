import express from 'express';
import { Form } from 'multiparty';

import { readSurveyXSLX, writeProgramToDatabase } from '../../surveyImporter';

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

function importSurvey(db, path) {
  return written;
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
  // update a program
});

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
      options: question.options && JSON.parse(question.options),
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

programRoutes.post('/surveyResponse', (req, res) => {
  // submit a new survey response
  const { db, body } = req;
  const { patientId, surveyId, date, startTime, endTime, answers } = body;

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
