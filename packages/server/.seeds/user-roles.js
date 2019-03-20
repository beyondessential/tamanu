export default (database) => {
  const baseRules = [
    { // allow 'read' for [models]
      actions: ['read'],
      subject: ['userRole', 'user', 'view', 'role']
    }, { // allow 'read' for [models]
      actions: ['read'],
      subject: ['hospital'],
      conditions: { "_id": "${hospitalId}" }
    }, {
      actions: ['manage'],
      subject: ['modifiedField']
    }, {
      actions: ['update'],
      subject: ['hospital'],
      fields: ['objectsFullySynced', 'modifiedBy', 'modifiedAt', 'modifiedFields', 'fullySynced'],
    }, { // don't allow 'delete' action for [model]
      actions: ['delete'],
      subject: [
        'userRole', 'user', 'view', 'program', 'question', 'surveyGroup', 'modifiedField',
        'surveyResponse', 'surveyScreenComponent', 'surveyScreen', 'survey', 'answer'
      ],
      inverted: true
    }
  ];

  const fillSurveys = [
    { // allow 'create' for [models]
      actions: ['create'],
      subject: ['surveyResponse', 'answer']
    }, { // allow 'read' for [models]
      actions: ['read'],
      subject: [
        'program', 'question', 'surveyGroup', 'surveyResponse',
        'surveyScreenComponent', 'surveyScreen', 'survey'
      ]
    }
  ];

  const seniorDoctor = [
    ...baseRules,
    ...fillSurveys,
    { // allow CRUD actions for [models]
      actions: ['manage'],
      subject: [
        'allergy', 'answer', 'appointment', 'diagnosis', 'condition', 'lab', 'imaging', 'medicationHistory', 'medication', 'note',
        'operationPlan', 'operationReport', 'patientContact', 'patient', 'photo', 'pregnancy',
        'procedureMedication', 'procedure', 'report', 'visit', 'vital'
      ]
    }, { // don't allow create / update actions for patient's model
      actions: ['create', 'delete'],
      subject: ['patient'],
      inverted: true
    }, { // don't allow 'update' for medication's `status` field
      actions: ['update'],
      subject: ['medication'],
      fields: ['status'],
      inverted: true
    }
  ];

  const juniorDoctor = [
    ...seniorDoctor,  // all abilities from `seniorDoctor`
    { // don't allow 'update' for [model]
      actions: ['update'],
      subject: ['lab', 'imaging'],
      fields: ['status'],
      inverted: true
    }, {
      actions: ['delete'],
      subject: ['lab', 'imaging'],
    }
  ];

  const seniorNurse = [ // all abilities from `juniorDoctor`
    ...juniorDoctor,
    { // don't allow 'delete' for [model]
      actions: ['create'],
      subject: ['operationPlan', 'operationReport'],
      inverted: true
    },
  ];

  const juniorNurse = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['read'],
      subject: ['appointment', 'patient', 'medication', 'lab', 'imaging'],
    }, {
      actions: ['create'],
      subject: ['note', 'vital'],
    }
  ];

  const midwife = [
    ...seniorNurse,
    {
      actions: ['create'],
      subject: ['appointment', 'diagnosis', 'condition'],
      inverted: true
    }, {
      actions: ['create', 'delete'],
      subject: ['medication'],
      inverted: true
    },
  ];

  const pharmacy = [
    ...midwife,
    { // don't allow 'update' for medication's `status` field
      actions: ['update'],
      subject: ['medication'],
    }
  ];

  const appliedHealth = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['read'],
      subject: ['appointment', 'patient', 'medication', 'lab'],
    }, {
      actions: ['create'],
      subject: ['medication'],
    }
  ];

  const admin = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['manage'],
      subject: ['user', 'role', 'userRole', 'view', 'patient'],
    }, {
      actions: ['read'],
      subject: ['medication'],
    }
  ];

  const finance = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['read'],
      subject: ['appointment', 'patient', 'medication'],
    }
  ];

  const radiology = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['read'],
      subject: ['appointment', 'patient', 'medication', 'lab'],
    }, {
      actions: ['manage'],
      subject: ['imaging'],
    }
  ];

  const lab = [
    ...baseRules,
    ...fillSurveys,
    {
      actions: ['read'],
      subject: ['appointment', 'patient', 'medication'],
    }, {
      actions: ['manage'],
      subject: ['lab']
    },
  ];

  const superUser = [
    {
      actions: ['manage'],
      subject: ['all'],
    }
  ];

  const roles = [
    {
      _id: 'senior-doctor',
      name: 'Senior Doctor',
      abilities: JSON.stringify(seniorDoctor)
    },
    {
      _id: 'junior-doctor',
      name: 'Junior Doctor',
      abilities: JSON.stringify(juniorDoctor)
    },
    {
      _id: 'senior-nurse',
      name: 'Senior Nurse',
      abilities: JSON.stringify(seniorNurse)
    },
    {
      _id: 'junior-nurse',
      name: 'Junior Nurse',
      abilities: JSON.stringify(juniorNurse)
    },
    {
      _id: 'midwife',
      name: 'Midwife',
      abilities: JSON.stringify(midwife)
    },
    {
      _id: 'pharmacy',
      name: 'Pharmacy',
      abilities: JSON.stringify(pharmacy)
    },
    {
      _id: 'applied-health',
      name: 'Applied Health',
      abilities: JSON.stringify(appliedHealth)
    },
    {
      _id: 'admin',
      name: 'Admin',
      abilities: JSON.stringify(admin)
    },
    {
      _id: 'finance',
      name: 'Finance',
      abilities: JSON.stringify(finance)
    },
    {
      _id: 'radiology',
      name: 'Radiology',
      abilities: JSON.stringify(radiology)
    },
    {
      _id: 'lab',
      name: 'Lab',
      abilities: JSON.stringify(lab)
    },
    {
      _id: 'super',
      name: 'Super',
      abilities: JSON.stringify(superUser)
    },
  ];

  database.write(() => roles.forEach(role => database.create('role', role, true)));
};
