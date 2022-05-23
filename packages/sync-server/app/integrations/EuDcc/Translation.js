import moment from 'moment-timezone';
import { transliterate as tr } from 'transliteration';
import config from 'config';
import { EUDCC_CERTIFICATE_TYPES, EUDCC_SCHEMA_VERSION } from 'shared/constants';
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
  'drug-COVID-19-Astra-Zeneca': 'EU/1/21/1529',
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

export async function createEuDccVaccinationData(administeredVaccineId, { models }) {
  const {
    Patient,
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
        model: Location,
        as: 'location',
        include: [
          {
            model: Facility,
            as: 'facility',
          },
        ],
      },
      {
        model: Encounter,
        as: 'encounter',
        include: [
          {
            model: Patient,
            as: 'patient',
          },
          {
            model: Location,
            as: 'location',
            include: [
              {
                model: Facility,
                as: 'facility',
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

  if (vaccination.status !== 'GIVEN') {
    throw new Error('Vaccination is not given');
  }

  const {
    id,
    date,
    location: {
      facility: { name: vaccineFacilityName },
    },
    scheduledVaccine: {
      schedule,
      vaccine: { id: vaccineId },
    },
    encounter: {
      patient,
      location: {
        facility: { name: encounterFacilityName },
      },
    },
  } = vaccination;
  
  const facilityName = vaccineFacilityName ?? encounterFacilityName;

  if (!Object.keys(DRUG_TO_PRODUCT).includes(vaccineId)) {
    throw new Error(`Unsupported vaccine: ${vaccineId}`);
  }

  const { timeZone, country } = await getLocalisation();

  const dob = moment(patient.dateOfBirth)
    .tz(timeZone)
    .format(MOMENT_FORMAT_ISODATE);
  const vaxDate = moment(date)
    .tz(timeZone)
    .format(MOMENT_FORMAT_ISODATE);

  return {
    ver: EUDCC_SCHEMA_VERSION,
    nam: nameSection(patient),
    dob,
    [EUDCC_CERTIFICATE_TYPES.VACCINATION]: [
      {
        tg: DISEASE_AGENT_CODE,
        vp: VACCINE_CODE,
        mp: DRUG_TO_PRODUCT[vaccineId],
        ma: DRUG_TO_ORG[vaccineId],
        dn: SCHEDULE_TO_SEQUENCE[schedule] ?? SEQUENCE_MAX + 1,
        sd: DRUG_TO_SCHEDULE_DOSAGE[vaccineId],
        dt: vaxDate,
        co: country['alpha-2'],
        is: config.integrations.euDcc.issuer ?? facilityName,
        ci: generateUVCI(id, { format: 'eudcc', countryCode: country['alpha-2'] }),
      },
    ],
  };
}

function transliterate(name) {
  return tr(name.toUpperCase()) // transliterate to ASCII
    .replace("'", '') // apostrophes shall be omitted
    .replace('-', '<') // hyphens as single filler
    .replace(/(\s+|,\s*)/g, '<') // commas as single filler (name parts are separated here)
    .replace(/<+/g, '<') // collapse multiple fillers
    .replace(/[^A-Z<]+/g, '') // all punctuation shall be omitted
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
