export const anonymous = () => {};

export const base = (user, allow, forbid) => {
  anonymous(user, allow, forbid);

  allow('read', 'User');
  allow('list', 'User');
  allow('write', 'User', { id: user.id });
};

export const reception = (user, allow, forbid) => {
  base(user, allow, forbid);
};

export const practitioner = (user, allow, forbid) => {
  base(user, allow, forbid);

  allow('list', 'ReferenceData');
  allow('read', 'ReferenceData');

  allow('read', 'Patient');
  allow('create', 'Patient');
  allow('write', 'Patient');
  allow('list', 'Patient');

  allow('list', 'LabRequest');
  allow('read', 'LabRequest');
  allow('write', 'LabRequest');
  allow('create', 'LabRequest');

  allow('list', 'LabTest');
  allow('read', 'LabTest');
  allow('write', 'LabTest');
  allow('create', 'LabTest');

  allow('read', 'Visit');
  allow('list', 'Visit');
  allow('create', 'Visit');
  allow('write', 'Visit');

  allow('read', 'Procedure');
  allow('list', 'Procedure');
  allow('create', 'Procedure');
  allow('write', 'Procedure');

  allow('read', 'Triage');
  allow('list', 'Triage');
  allow('create', 'Triage');
  allow('write', 'Triage');

  allow('list', 'Vitals');
  allow('read', 'Vitals');
  allow('create', 'Vitals');

  allow('read', 'VisitDiagnosis');
  allow('write', 'VisitDiagnosis');
  allow('create', 'VisitDiagnosis');
  allow('list', 'VisitDiagnosis');

  allow('read', 'VisitMedication');
  allow('write', 'VisitMedication');
  allow('create', 'VisitMedication');
  allow('list', 'VisitMedication');
};

export const admin = (user, allow, forbid) => {
  practitioner(user, allow, forbid);

  allow('create', 'User');
  allow('write', 'User');

  allow('write', 'ReferenceData');
  allow('create', 'ReferenceData');
};
