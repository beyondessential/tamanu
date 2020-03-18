
export const anonymous = (user, allow, forbid) => {
};

export const base = (user, allow, forbid) => {
  anonymous(user, allow, forbid);

  allow('read', 'User');
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

  allow('read', 'Visit');
  allow('list', 'Visit');
  allow('create', 'Visit');
  allow('write', 'Visit');

  allow('list', 'Vitals');
  allow('read', 'Vitals');
  allow('create', 'Vitals');

  allow('read', 'VisitDiagnosis');
  allow('write', 'VisitDiagnosis');
  allow('create', 'VisitDiagnosis');
  allow('list', 'VisitDiagnosis');
};

export const admin = (user, allow, forbid) => {
  practitioner(user, allow, forbid);

  allow('create', 'User');
  allow('write', 'User');

  allow('write', 'ReferenceData');
  allow('create', 'ReferenceData');
};
