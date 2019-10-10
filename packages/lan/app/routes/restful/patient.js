import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const patientRoutes = express.Router();

patientRoutes.post('/patient', (req, res) => {
  const { db, body } = req;
  const patient = {
    _id: shortid(),
    ...body,
  };

  db.write(() => {
    db.create('patient', patient);
  });

  res.send(patient);
});

patientRoutes.post('/patient/:id/triages', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const triage = {
    _id: shortid(),
    arrivalTime: body.triageTime,
    ...body,
  };

  const visit = {
    _id: shortid(),
    visitType: 'triage',
    startDate: req.body.triageTime,
    reasonForVisit: triage.reasonForVisit,
    examiner: triage.practitioner,
    location: triage.location,
  };

  triage.visit = visit;

  db.write(() => {
    patient.triages = [...patient.triages, triage];
    patient.visits = [...patient.visits, visit];
  });

  res.send(triage);
});

patientRoutes.post('/patient/:id/visits', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const visit = {
    _id: shortid(),
    ...body,
  };

  // check if there's an open triage - if there is, close it with
  // this visit.
  const triage = patient.triages.filtered('closedTime == null')[0];

  // check if there was a referral selected, and close it with this visit
  const referralId = visit.referral && visit.referral._id;
  const referral = patient.referrals.filtered('_id == $0', referralId)[0];

  db.write(() => {
    patient.visits = [...patient.visits, visit];

    if (triage) {
      triage.visit = visit;
      triage.closedTime = visit.startDate;
    }

    if (referral) {
      referral.visit = visit;
      referral.closedDate = visit.startDate;
    }
  });

  res.send(visit);
});

patientRoutes.post('/patient/:id/conditions', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const condition = {
    _id: shortid(),
    ...body,
  };

  db.write(() => {
    patient.conditions = [...patient.conditions, condition];
  });

  res.send(condition);
});

patientRoutes.post('/patient/:id/allergies', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const allergy = {
    _id: shortid(),
    ...body,
  };

  db.write(() => {
    patient.allergies = [...patient.allergies, allergy];
  });

  res.send(allergy);
});

patientRoutes.post('/patient/:id/familyHistory', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const historyItem = {
    _id: shortid(),
    ...body,
  };

  db.write(() => {
    patient.familyHistory = [...patient.familyHistory, historyItem];
  });

  res.send(historyItem);
});

patientRoutes.post('/patient/:id/appointment', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const appointment = {
    _id: shortid(),
    status: 'scheduled',
    ...body,
  };

  // TODO: validate

  db.write(() => {
    patient.appointments = [...patient.appointments, appointment];
  });

  res.send(objectToJSON(appointment));
});

patientRoutes.post('/patient/:id/referral', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const referral = {
    _id: shortid(),
    status: 'pending',
    ...body,
  };

  // TODO: validate

  db.write(() => {
    patient.referrals = [...patient.referrals, referral];
  });

  res.send(objectToJSON(referral));
});
