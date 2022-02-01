import moment from 'moment';

// FIXME
const generateUniqueCode = () => 'asdfghjkl;asdfgh';

// FIXME
const getFacilityName = patientId => 'asdfghjkl;asdfgh';

// FIXME
const getFacilityDetails = () => ({
  p: 'ph #',
  e: 'email',
  a: 'address',
});

const SEX_TO_CHAR = {
  male: 'M',
  female: 'F',
  other: 'O',
};

// FIXME: for higher?
const SCHEDULE_TO_SEQUENCE = {
  'Dose 1': 1,
  'Dose 2': 2,
  Booster: 3,
};

export const createPoV = async (models, patientId) => {
  const { firstName, lastName, dateOfBirth, sex } = await models.Patient.findById(patientId);
  const { passport } = await models.PatientAdditionalData.findOne({ where: { patientId } });
  const vaccinations = await models.AdministeredVaccine.findAll({
    where: {
      '$encounter.patient_id$': patientId,
      '$scheduledVaccine.label$': ['COVID-19 AZ', 'COVID-19 Pfizer'],
      status: 'GIVEN',
    },
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: models.Encounter.getFullReferenceAssociations(),
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
    ],
  });

  const pid = {};

  return {
    utci: generateUniqueCode(),
    pid: pid(firstName, lastName, dateOfBirth, { sex, passport }),
    // ve = vax type, vd = vax dose
    ve: [
      {
        des: 'XM68M6',
        name: v.label, // <- check
        dis: 'RA01.0',
        vd: doses.map(dose => ({
          seq: SCHEDULE_TO_SEQUENCE[dose.scheduledVaccine.schedule],
          ctr: getCountryCode(),
          lot: dose.batch,
          dvn: dose.date,
        })),
      },
    ],
  };
};

export const createPoT = patientId => {
  const { firstName, lastName, dateOfBirth, sex } = await models.Patient.findById(patientId);
  const { passport } = await models.PatientAdditionalData.findOne({ where: { patientId } });

  return {
    utci: generateUniqueCode(),
    pid: pid(firstName, lastName, dateOfBirth, { passport, sex }),
    sp: {
      spn: getFacilityName(patientId),
      ctr: getCountryCode(),
      cd: getFacilityDetails(),
    },
    dat: {
      sc: 'specimen collection',
      ri: 'report issuance',
    },
    tr: {
      tc: 'test conducted',
      r: 'result',
    },
  };
};

function pid(firstName, lastName, dateOfBirth, {
  passport = null,
  sex = null,
} = {}) {
  // TODO: transliteration requirements?
  const name = `${firstName.slice(39 - (lastName.length + 1))} ${lastName}`;

  const pid = {
    n: name,
    dob: moment(dateOfBirth).format('YYY-MM-DD'),
  };

  if (passport) {
    pid.dt = 'P';
    pid.dn = passport;
  }

  if (sex && SEX_TO_CHAR[sex]) {
    pid.sex = SEX_TO_CHAR[sex];
  }

  return pid;
}
