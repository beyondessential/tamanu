import moment from 'moment';
import { transliterate as tr } from 'transliteration';

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

const SCHEDULE_TO_SEQUENCE = {
  'Dose 1': 1,
  'Dose 2': 2,
  Booster: 3,
};
const SEQUENCE_MAX = Math.max(...Object.values(SCHEDULE_TO_SEQUENCE));

const ICD11_COVID19_VACCINE = 'XM68M6';
const ICD11_COVID19_DISEASE = 'RA01.0';

export const createPoV = async (models, patientId) => {
  const { Patient, PatientAdditionalData, ReferenceData, AdministeredVaccine, Encounter, Location, ScheduledVaccine } = models;
  const { firstName, lastName, dateOfBirth, sex } = await Patient.findById(patientId);
  const { passport } = await PatientAdditionalData.findOne({ where: { patientId } });
  const vaccinations = await AdministeredVaccine.findAll({
    where: {
      '$encounter.patient_id$': patientId,
      '$scheduledVaccine.label$': ['COVID-19 AZ', 'COVID-19 Pfizer'],
      status: 'GIVEN',
    },
    include: [
      {
        model: Encounter,
        as: 'encounter',
        include: [{
          model: Location,
          as: 'location',
          include: ['facility'],
        }],
      },
      {
        model: ScheduledVaccine,
        as: 'scheduledVaccine',
        include: [{
          model: ReferenceData,
          as: 'referenceData',
        }],
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
      batch,
      scheduledVaccine: {
        schedule,
        referenceData: {
          name: label,
        },
      },
      encounter: {
        location: {
          facility: {
            name: facility,
          }
        }
      }
    } = dose;

    const event = {
      dvc: moment(date).format('YYYY-MM-DD'),
      seq: SCHEDULE_TO_SEQUENCE[schedule] ?? (SEQUENCE_MAX + 1),
      ctr: config.icao.sign.countryCode3,
      lot: batch,
      adm: facility,
    };

    if (vaccines.has(label)) {
      const vax = vaccines.get(label);
      vax.vd.push(event);
      vaccines.set(label, vax);
    } else {
      vaccines.set(label, {
        des: ICD11_COVID19_VACCINE,
        nam: label,
        dis: ICD11_COVID19_DISEASE,
        vd: event,
      });
    }
  }

  return {
    pid: {
      ...pid(firstName, lastName, dateOfBirth, sex),
      ...pidDoc,
    },
    ve: [...vaccines.values()],
  };
};

export const createPoT = patientId => {
  const { Patient, PatientAdditionalData } = models;
  const { firstName, lastName, dateOfBirth, sex } = await Patient.findById(patientId);
  const { passport } = await PatientAdditionalData.findOne({ where: { patientId } });

  const pidDoc = passport ? {
    dt: 'P',
    dn: passport,
  } : {};

  return {
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
  const MAX_LEN = 39;
  const primary = tr(lastName);
  const secondary = tr(firstName);

  // Truncation from 9303-4, a bit simplified as we're not in MRZ
  let name;
  if (primary.length >= MAX_LEN - 3) {
    name = [primary.slice(0, MAX_LEN - 3), secondary].join(' ').slice(0, MAX_LEN);
  } else {
    name = [primary, secondary].join(' ').slice(0, MAX_LEN);
  }

  const pid = {
    n: name,
    dob: moment(dateOfBirth).format('YYY-MM-DD'),
  };

  if (sex && SEX_TO_CHAR[sex]) {
    pid.sex = SEX_TO_CHAR[sex];
  }

  return pid;
}
