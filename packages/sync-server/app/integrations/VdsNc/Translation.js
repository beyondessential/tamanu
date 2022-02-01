import moment from 'moment';
import { transliterate as tr } from 'transliteration';

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

const ICD11_COVID19_VACCINE = 'XM68M6';
const ICD11_COVID19_DISEASE = 'RA01.0';

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

  const pidDoc = passport ? {
    i: passport,
  } : {};

  // Group by vaccine brand/label
  const vaccines = new Map;
  for (const dose of vaccinations) {
    const {
      scheduledVaccine: {
        label,
        batch,
        lot,
        schedule,
      }
    } = dose;

    const event = {
      dvc: moment(date).format('YYYY-MM-DD'),
      seq: SCHEDULE_TO_SEQUENCE[schedule] ?? (Math.max(...Object.values(SCHEDULE_TO_SEQUENCE)) + 1),
      ctr: config.icao.sign.countryCode3,
      lot: batch,
      // adm, // TODO: facility?
    };

    if (vaccines.has(label)) {
      const vax = vaccines.get(label);
      vax.vd.push(event);
      vaccines.set(label, vax);
    } else {
      vaccines.set(label, {
        des: ICD11_COVID19_VACCINE,
        nam: label, // TODO: check that's the right field (brand name?)
        dis: ICD11_COVID19_DISEASE,
        vd: event,
      });
    }
  }

  return {
    uvci: generateUniqueCode(),
    pid: {
      ...pid(firstName, lastName, dateOfBirth, sex),
      ...pidDoc,
    },
    ve: [...vaccines.values()],
  };
};

export const createPoT = patientId => {
  const { firstName, lastName, dateOfBirth, sex } = await models.Patient.findById(patientId);
  const { passport } = await models.PatientAdditionalData.findOne({ where: { patientId } });

  const pidDoc = passport ? {
    dt: 'P',
    dn: passport,
  } : {};

  return {
    utci: generateUniqueCode(),
    pid: {
      ...pid(firstName, lastName, dateOfBirth, sex),
      ...pidDoc
    },
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

function pid(firstName, lastName, dateOfBirth, sex) {
  const name = `${tr(lastName)} ${tr(firstName).slice(39 - (tr(lastName).length + 1))}`;

  const pid = {
    n: name,
    dob: moment(dateOfBirth).format('YYY-MM-DD'),
  };

  if (sex && SEX_TO_CHAR[sex]) {
    pid.sex = SEX_TO_CHAR[sex];
  }

  return pid;
}
