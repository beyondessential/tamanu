import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';
import { handleGenericGetRequest } from '../../controllers/realm/get';

export const encounterRoutes = express.Router();

encounterRoutes.get('/inpatient', (req, res) => {
  req.params = { model: 'encounter' };
  handleGenericGetRequest(req, res, objects =>
    objects
      .filtered('endDate = null')
      .filtered('encounterType = "emergency" OR encounterType = "admission"'),
  );
});

encounterRoutes.get('/outpatient', (req, res) => {
  req.params = { model: 'encounter' };
  handleGenericGetRequest(req, res, objects =>
    objects
      .filtered('endDate = null')
      .filtered('NOT (encounterType = "emergency" OR encounterType = "admission")'),
  );
});

encounterRoutes.get('/encounter/:id', (req, res) => {
  const { db, params } = req;
  const { id } = params;

  const encounter = db.objectForPrimaryKey('encounter', id);
  if(!encounter) {
    res.status(404).end();
  }
  
  // override default behaviour to provide enough depth to catch 
  // encounter.surveyResponses[].survey.program.name
  res.send(objectToJSON(encounter, 6));
});

function addSystemNote(encounter, content) {
  const note = {
    _id: shortid.generate(),
    type: 'system',
    content,
  };

  encounter.notes = [...encounter.notes, note];
}

encounterRoutes.put('/encounter/:id/encounterType', (req, res) => {
  const { db, params, body } = req;
  const { encounterType } = body;

  const encounter = db.objectForPrimaryKey('encounter', params.id);

  if (encounterType !== encounter.encounterType) {
    db.write(() => {
      addSystemNote(encounter, `Changed from ${encounter.encounterType} to ${encounterType}`);
      encounter.encounterType = encounterType;
    });
  }

  res.send(objectToJSON(encounter));
});

encounterRoutes.put('/encounter/:id/department', (req, res) => {
  const { db, params, body } = req;
  const { department } = body;

  const encounter = db.objectForPrimaryKey('encounter', params.id);

  if (department._id !== encounter.department._id) {
    const newDepartment = db.objectForPrimaryKey('department', department._id);
    if (!newDepartment) {
      throw new Error('Invalid department ID');
    }

    db.write(() => {
      addSystemNote(
        encounter,
        `Changed department from ${encounter.department.name} to ${newDepartment.name}`,
      );
      encounter.department = department;
    });
  }

  res.send(objectToJSON(encounter));
});

encounterRoutes.put('/encounter/:id/plannedLocation', (req, res) => {
  const { db, params, body } = req;
  const { plannedLocation } = body;

  const encounter = db.objectForPrimaryKey('encounter', params.id);

  // cancel a planned change
  if (encounter.plannedLocation) {
    if (!plannedLocation) {
      db.write(() => {
        addSystemNote(encounter, 'Cancelled location change.');
        encounter.plannedLocation = plannedLocation;
      });
      res.send(objectToJSON(encounter));
      return;
    }
    throw new Error('A location change is already planned');
  }

  // plan a new change
  if (!plannedLocation) {
    throw new Error('Planned location invalid!');
  }

  if (plannedLocation._id === encounter.location._id) {
    throw new Error('Planned location must be different to current location.');
  }

  const newLocation = db.objectForPrimaryKey('location', plannedLocation._id);
  if (!newLocation) {
    throw new Error('Planned location invalid!');
  }

  db.write(() => {
    addSystemNote(encounter, `Planned location change to ${newLocation.name}`);
    encounter.plannedLocation = plannedLocation;
  });

  res.send(objectToJSON(encounter));
});

encounterRoutes.put('/encounter/:id/location', (req, res) => {
  const { db, params, body } = req;
  const { location } = body;

  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const newLocation = db.objectForPrimaryKey('location', location._id);

  if (!encounter.plannedLocation || location._id !== encounter.plannedLocation._id) {
    throw new Error('Location cannot be updated without being planned first');
  }

  if (location._id !== encounter.location._id) {
    db.write(() => {
      addSystemNote(encounter, `Completed move from ${encounter.location.name} to ${newLocation.name}`);
      encounter.plannedLocation = null;
      encounter.location = location;
    });
  }

  res.send(objectToJSON(encounter));
});

encounterRoutes.post('/encounter/:id/note', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const note = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    encounter.notes = [...encounter.notes, note];
  });

  res.send(objectToJSON(note));
});

encounterRoutes.post('/encounter/:id/diagnosis', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const diagnosis = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  // get previous diagnoses of the same type
  const previousDiagnoses = db
    .objects('patientDiagnosis')
    .filtered(
      `diagnosis._id = $0 AND encounter.patient._id = $1 AND NOT (certainty = "error" OR certainty = "disproven")`,
      body.diagnosis._id,
      encounter.patient[0]._id,
    )
    .map(x => x);  // the query is lazily evaluated but we want to run it now, this forces it

  db.write(() => {
    encounter.diagnoses = [...encounter.diagnoses, diagnosis];
  });

  res.send(
    objectToJSON({
      diagnosis,
      previousDiagnoses,
    }),
  );
});

encounterRoutes.post('/encounter/:id/procedure', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const procedure = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    encounter.procedures = [...encounter.procedures, procedure];
  });

  res.send(objectToJSON(procedure));
});

encounterRoutes.post('/encounter/:id/labRequest', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
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
    encounter.labRequests = [...encounter.labRequests, request];
  });

  res.send(objectToJSON(request));
});

encounterRoutes.post('/encounter/:id/imagingRequest', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const request = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    encounter.imagingRequests = [...encounter.imagingRequests, request];
  });

  res.send(objectToJSON(request));
});

encounterRoutes.post('/encounter/:id/vitals', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const reading = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    encounter.vitals = [...encounter.vitals, reading];
  });

  res.send(objectToJSON(reading));
});

encounterRoutes.post('/encounter/:id/medications', (req, res) => {
  const { db, params, body } = req;
  const encounter = db.objectForPrimaryKey('encounter', params.id);
  const medication = {
    _id: shortid.generate(),
    ...body,
  };

  // TODO: validate

  db.write(() => {
    encounter.medications = [...encounter.medications, medication];
  });

  res.send(objectToJSON(medication));
});
