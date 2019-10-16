import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const visitRoutes = express.Router();

function addSystemNote(visit, content, type = 'system') {
  const note = {
    _id: shortid.generate(),
    type,
    content,
  };

  visit.notes = [...visit.notes, note];
}

visitRoutes.put('/visit/:id/visitType', (req, res) => {
  const { db, params, body } = req;
  const { visitType } = body;

  const visit = db.objectForPrimaryKey('visit', params.id);

  if (visitType !== visit.visitType) {
    db.write(() => {
      addSystemNote(visit, `Changed from ${visit.visitType} to ${visitType}`);
      visit.visitType = visitType;
    });
  }

  res.send(objectToJSON(visit));
});

visitRoutes.put('/visit/:id/department', (req, res) => {
  const { db, params, body } = req;
  const { department } = body;

  const visit = db.objectForPrimaryKey('visit', params.id);

  if (department._id !== visit.department._id) {
    const newDepartment = db.objectForPrimaryKey('department', department._id);
    db.write(() => {
      addSystemNote(visit, `Changed department from ${visit.department.name} to ${newDepartment.name}`);
      visit.department = department;
    });
  }

  res.send(objectToJSON(visit));
});

visitRoutes.put('/visit/:id/plannedLocation', (req, res) => {
  const { db, params, body } = req;
  const { plannedLocation } = body;

  const visit = db.objectForPrimaryKey('visit', params.id);

  if (!visit.plannedLocation || !plannedLocation || plannedLocation._id !== visit.plannedLocation._id) {
    db.write(() => {
      if(plannedLocation) {
        const newLocation = db.objectForPrimaryKey('location', plannedLocation._id);
        addSystemNote(visit, `Planned location change to ${newLocation.name}`);
      } else {
        addSystemNote(visit, 'Cancelled location change.');
      }
      visit.plannedLocation = plannedLocation;
    });
  }

  res.send(objectToJSON(visit));
});

visitRoutes.put('/visit/:id/location', (req, res) => {
  const { db, params, body } = req;
  const { location } = body;

  const visit = db.objectForPrimaryKey('visit', params.id);
  const newLocation = db.objectForPrimaryKey('location', location._id);

  if (!visit.plannedLocation || location._id !== visit.plannedLocation._id) {
    throw new Error('Location cannot be updated without being planned first');
  }

  if (location._id !== visit.location._id) {
    db.write(() => {
      addSystemNote(visit, `Completed move from ${visit.location.name} to ${newLocation.name}`);
      visit.plannedLocation = null;
      visit.location = location;
    });
  }

  res.send(objectToJSON(visit));
});

visitRoutes.post('/visit/:id/note', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const note = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.notes = [...visit.notes, note];
  });

  res.send(objectToJSON(note));
});

visitRoutes.post('/visit/:id/diagnosis', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const diagnosis = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.diagnoses = [...visit.diagnoses, diagnosis];
  });

  res.send(objectToJSON(diagnosis));
});

visitRoutes.post('/visit/:id/labRequest', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const request = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  // create tests for each testType given
  request.tests = request.testTypes.map(({ _id: typeId }) => ({
    _id: shortid.generate(),
    type: { _id: typeId },
  }));

  db.write(() => {
    visit.labRequests = [...visit.labRequests, request];
  });

  res.send(objectToJSON(request));
});

visitRoutes.post('/visit/:id/vitals', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const reading = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.vitals = [...visit.vitals, reading];
  });

  res.send(objectToJSON(reading));
});

visitRoutes.post('/visit/:id/medications', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const medication = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.medications = [...visit.medications, medication];
  });

  res.send(objectToJSON(medication));
});
