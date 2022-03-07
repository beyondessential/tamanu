import moment from 'moment';
import { transliterate as tr } from 'transliteration';
import config from 'config';
import { EUDCC_CERTIFICATION_TYPES, EUDCC_SCHEMA_VERSION } from 'shared/constants';
import { generateUVCI } from 'shared/utils/uvci';
import { getLocalisation } from '../../localisation';

const SCHEDULE_TO_SEQUENCE = {
  'Dose 1': 1,
  'Dose 2': 2,
  Booster: 3,
};
const SEQUENCE_MAX = Math.max(...Object.values(SCHEDULE_TO_SEQUENCE));

const DISEASE_AGENT_CODE = '840539006';
const VACCINE_CODE = 'J07BX03';

const DRUG_TO_PRODUCT = {
  'drug-COVID-19-Astra-Zeneca': 'EU/1/20/1529',
  'drug-COVID-19-Pfizer': 'EU/1/20/1528',
};

const DRUG_TO_ORG = {
  'drug-COVID-19-Astra-Zeneca': 'ORG-100001699',
  'drug-COVID-19-Pfizer': 'ORG-100030215',
};

const DRUG_TO_SCHEDULE_DOSAGE = {
  'drug-COVID-19-Astra-Zeneca': 3,
  'drug-COVID-19-Pfizer': 3,
};

const MOMENT_FORMAT_ISODATE = 'YYYY-MM-DD';

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
            model: Patient,
            as: 'patient',
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
    id,
    date,
    scheduledVaccine: {
      schedule,
      vaccine: { name: label },
    },
    encounter: {
      patient,
    },
  } = vaccination;

  if (!Object.keys(DRUG_TO_PRODUCT).includes(label)) {
    throw new Error(`Unsupported vaccine: ${label}`);
  }

  const { timeZone, country } = await getLocalisation();

  const dob = moment(patient.dateOfBirth).timezone(timeZone).format(MOMENT_FORMAT_ISODATE);
  const vaxDate = moment(date).timezone(timeZone).format(MOMENT_FORMAT_ISODATE);

  return {
    ver: EUDCC_SCHEMA_VERSION,
    nam: nameSection(patient),
    dob,
    [EUDCC_CERTIFICATION_TYPES.VACCINATION]: [
      {
        tg: DISEASE_AGENT_CODE,
        vp: VACCINE_CODE,
        mp: DRUG_TO_PRODUCT[label],
        ma: DRUG_TO_ORG[label],
        dn: SCHEDULE_TO_SEQUENCE[schedule] ?? SEQUENCE_MAX + 1,
        sd: DRUG_TO_SCHEDULE_DOSAGE[label],
        dt: vaxDate,
        co: country['alpha-2'],
        is: config.integrations.euDcc.issuer,
        ci: generateUVCI(id, 'eudcc', { countryCode: country['alpha-2'] }),
      },
    ],
  };
};

function transliterate(name) {
  return tr(name.toUpperCase()) // transliterate to ASCII
    .replace("'", '') // apostrophes shall be omitted
    .replace('-', '<') // hyphens as single filler
    .replace(/,\s*/g, '<') // commas as single filler (name parts are separated here)
    .replace(/[^A-Z]+/g, '') // all punctuation shall be omitted
    .replace(/<+/g, '<') // collapse multiple fillers
    .substring(0, 80); // maximum length is 80
}

function nameSection(patient) {
  const { firstName, lastName } = patient;

  return {
    fn: lastName,
    fnt: transliterate(lastName),
    gn: firstName,
    gnt: transliterate(firstName),
  };
}