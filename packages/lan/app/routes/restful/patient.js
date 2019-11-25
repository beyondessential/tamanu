import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const patientRoutes = express.Router();

patientRoutes.post('/patient', (req, res) => {
  const { db, body } = req;
  const patient = {
    _id: shortid.generate(),
    ...body,
  };

  // update parent fields with actual database references
  // (the usual method of just setting it to any old object with the right pkey 
  // doesn't work on these fields for some reason)
  const getPatient = (obj) => obj && db.objectForPrimaryKey('patient', obj._id);
  patient.mother = getPatient(patient.mother);
  patient.father = getPatient(patient.father);

  db.write(() => {
    db.create('patient', patient);
  });

  res.send(objectToJSON(patient));
});

patientRoutes.post('/patient/:id/triages', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const triage = {
    _id: shortid.generate(),
    arrivalTime: body.triageTime,
    ...body,
  };

  const visit = {
    _id: shortid.generate(),
    visitType: 'triage',
    startDate: triage.arrivalTime,
    reasonForVisit: triage.reasonForVisit,
    examiner: triage.practitioner,
    location: triage.location,
  };

  // add vitals reading to visit if present
  if (body.vitals) {
    const vitals = {
      _id: shortid.generate(),
      ...body.vitals,
    };
    visit.vitals = [vitals];
  }

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
    _id: shortid.generate(),
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
    _id: shortid.generate(),
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
    _id: shortid.generate(),
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
    _id: shortid.generate(),
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
    _id: shortid.generate(),
    status: 'pending',
    ...body,
  };

  // TODO: validate

  db.write(() => {
    patient.referrals = [...patient.referrals, referral];
  });

  res.send(objectToJSON(referral));
});

patientRoutes.post('/patient/:id/issue', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const issue = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    patient.issues = [...patient.issues, issue];
  });

  res.send(objectToJSON(issue));
});

patientRoutes.put('/patient/:id/death', (req, res) => {
  const { db, params, body } = req;
  const patient = db.objectForPrimaryKey('patient', params.id);
  const death = {
    _id: shortid.generate(),
    ...patient.death,
    ...body,
  };

  // TODO: validate

  db.write(() => {
    patient.death = death;
  });

  res.send(objectToJSON(death));
});
