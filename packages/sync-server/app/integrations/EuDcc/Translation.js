import moment from 'moment';
import { transliterate as tr } from 'transliteration';
import allModels from 'shared/models';
import config from 'config';
import { EUDCC_SCHEMA_VERSION } from 'shared/constants';

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

const METHOD_CODE = {
  GeneXpert: 'antigen',
  RTPCR: 'molecular(PCR)',
  RDT: 'antigen',
};

const ICD11_COVID19_VACCINE = 'XM68M6';
const ICD11_COVID19_DISEASE = 'RA01.0';

const MOMENT_FORMAT_ISODATE = 'YYYY-MM-DD';
const MOMENT_FORMAT_RFC3339 = 'YYYY-MM-DDTHH:mm:ssZ';

export async function createCovidVaccinationCertificateData(administeredVaccineId) {
  const {
    Patient,
    PatientAdditionalData,
    ReferenceData,
    AdministeredVaccine,
    Encounter,
    Facility,
    Location,
    ScheduledVaccine,
  } = models;

  const vaccination = await AdministeredVaccine.findByPk(administeredVaccineId, {
    include: [
      {
        model: Encounter,
        as: 'encounter',
        include: [
          {
            model: Location,
            as: 'location',
            include: [
              {
                model: Facility,
                as: 'Facility',
              },
            ],
          },
          {
            model: Patient,
            as: 'patient',
            include: [
              {
                model: PatientAdditionalData,
                as: 'additionalData',
              },
            ],
          },
        ],
      },
      {
        model: ScheduledVaccine,
        as: 'scheduledVaccine',
        include: [
          {
            model: ReferenceData,
            as: 'vaccine',
          },
        ],
      },
    ],
  });
  
  if (!vaccination) {
    throw new Error(`No vaccination found with id=${administeredVaccineId}`);
  }

  if (!['COVID-19 AZ', 'COVID-19 Pfizer'].includes(vaccination.scheduledVaccine.label)) {
    throw new Error('Vaccination is not a COVID-19 vaccine');
  }

  if (vaccination.status !== 'GIVEN') {
    throw new Error('Vaccination is not given');
  }

  const {
    batch,
    date,
    scheduledVaccine: {
      schedule,
      vaccine: { name: label },
    },
    encounter: {
      location: {
        Facility: { name: facility },
      },
    },
  } = vaccination;

  return {
    ver: EUDCC_SCHEMA_VERSION,
    nam: nameSection(vaccination.encounter.patient),
    dob: '1964-01-01', // TODO: get from timezoned from dev rebase
    v: [
      {
        tg: '840539006',
        vp: '1119349007',
        mp: 'EU/1/20/1507',
        ma: 'ORG-100031184',
        dn: 1,
        sd: 2,
        dt: '2021-06-11',
        co: 'NL',
        is: 'Ministry of Health Welfare and Sport',
        ci: 'URN:UVCI:01:NL:DADFCC47C7334E45A906DB12FD859FB7',
      },
    ],
  };

  // Group by vaccine brand/label
  const vaccines = new Map();
  for (const dose of vaccinations) {
    

    const event = {
      dvc: moment(date)
        .utc()
        .format(MOMENT_FORMAT_ISODATE),
      seq: SCHEDULE_TO_SEQUENCE[schedule] ?? SEQUENCE_MAX + 1,
      ctr: countryCode,
      lot: batch || 'Unknown', // If batch number was not recorded, we add a indicative string value to complete ICAO validation
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
        vd: [event],
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

function nameSection(patient) {
  const { firstName, lastName, dateOfBirth, sex } = patient;
  const { passport } = patient.additionalData;
  
  return {
    fn: 'ابو بكر محمد بن زكريا الرازي',
    fnt: 'ABW<BKR<MXHMD<BN<ZKRYA<ALRAZY',
    gn: 'ناصر',
    gnt: 'NAXSSR',
  };

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

  const data = {
    n: name,
    dob: moment(dateOfBirth).format(MOMENT_FORMAT_ISODATE),
  };

  if (sex && SEX_TO_CHAR[sex]) {
    data.sex = SEX_TO_CHAR[sex];
  }

  return data;
}
