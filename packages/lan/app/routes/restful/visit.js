import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';
import { handleGenericGetRequest } from '../../controllers/realm/get';

export const visitRoutes = express.Router();

visitRoutes.get('/inpatient', (req, res) => {
  req.params = { model: 'visit' };
  handleGenericGetRequest(req, res, objects =>
    objects
      .filtered('endDate = null')
      .filtered('visitType = "emergency" OR visitType = "admission"'),
  );
});

visitRoutes.get('/outpatient', (req, res) => {
  req.params = { model: 'visit' };
  handleGenericGetRequest(req, res, objects =>
    objects
      .filtered('endDate = null')
      .filtered('NOT (visitType = "emergency" OR visitType = "admission")'),
  );
});

function addSystemNote(visit, content) {
  const note = {
    _id: shortid.generate(),
    type: 'system',
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
    if (!newDepartment) {
      throw new Error('Invalid department ID');
    }

    db.write(() => {
      addSystemNote(
        visit,
        `Changed department from ${visit.department.name} to ${newDepartment.name}`,
      );
      visit.department = department;
    });
  }

  res.send(objectToJSON(visit));
});

visitRoutes.put('/visit/:id/plannedLocation', (req, res) => {
  const { db, params, body } = req;
  const { plannedLocation } = body;

  const visit = db.objectForPrimaryKey('visit', params.id);

  // cancel a planned change
  if (visit.plannedLocation) {
    if (!plannedLocation) {
      db.write(() => {
        addSystemNote(visit, 'Cancelled location change.');
        visit.plannedLocation = plannedLocation;
      });
      res.send(objectToJSON(visit));
      return;
    }
    throw new Error('A location change is already planned');
  }

  // plan a new change
  if (!plannedLocation) {
    throw new Error('Planned location invalid!');
  }

  if (plannedLocation._id === visit.location._id) {
    throw new Error('Planned location must be different to current location.');
  }

  const newLocation = db.objectForPrimaryKey('location', plannedLocation._id);
  if (!newLocation) {
    throw new Error('Planned location invalid!');
  }

  db.write(() => {
    addSystemNote(visit, `Planned location change to ${newLocation.name}`);
    visit.plannedLocation = plannedLocation;
  });

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

  // get previous diagnoses of the same type
  const previousDiagnoses = db
    .objects('patientDiagnosis')
    .filtered(
      'diagnosis._id = $0 AND visit.patient._id = $1',
      body.diagnosis._id,
      visit.patient[0]._id,
    );

  db.write(() => {
    visit.diagnoses = [...visit.diagnoses, diagnosis];
  });

  res.send(
    objectToJSON({
      diagnosis,
      previousDiagnoses,
    }),
  );
});

visitRoutes.post('/visit/:id/procedure', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const procedure = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.procedures = [...visit.procedures, procedure];
  });

  res.send(objectToJSON(procedure));
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

visitRoutes.post('/visit/:id/imagingRequest', (req, res) => {
  const { db, params, body } = req;
  const visit = db.objectForPrimaryKey('visit', params.id);
  const request = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    visit.imagingRequests = [...visit.imagingRequests, request];
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
