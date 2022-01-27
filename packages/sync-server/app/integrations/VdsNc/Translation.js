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

  return {
    utci: generateUniqueCode(),
    pid: {
      // This field can only be 39 characters long, just truncate the name
      // FIXME: see test
      n: `${firstName} ${lastName}`.slice(0, 39),
      dob: moment(dateOfBirth).format('YYYY-MM-DD'),
      i: passport ?? undefined,
      sex: SEX_TO_CHAR[sex],
    },
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
  const { firstName, lastName, dateOfBirth } = patient;
  const { passport } = additionalData;

  return {
    utci: generateUniqueCode(),
    pid: {
      // This field can only be 39 characters long, just truncate the name
      n: `${firstName} ${lastName}`.slice(0, 39),
      dob: moment(dateOfBirth).format('YYYY-MM-DD'),
      dt: 'P', // Document type = passport
      dn: passport ?? 'Passport # not found',
    },
    sp: {
      spn: getFacilityName(patientId),
      ctr: getCountryCode(),
      cd: {
        ...getFacilityDetails(),
      },
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
