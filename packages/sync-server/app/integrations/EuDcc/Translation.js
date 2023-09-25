import { formatInTimeZone } from 'date-fns-tz';
import { transliterate as tr } from 'transliteration';
import { EUDCC_CERTIFICATE_TYPES, EUDCC_SCHEMA_VERSION } from '@tamanu/constants';
import { generateUVCI } from 'shared/utils/uvci';

const SCHEDULE_TO_SEQUENCE = {
  'Dose 1': 1,
  'Dose 2': 2,
  Booster: 3,
  'Dose 3': 3,
  'Dose 4': 4,
  'Dose 5': 5,
  'Dose 6': 6,
  'Dose 7': 7,
  'Dose 8': 8,
  'Dose 9': 9,
};

const FORMAT_ISODATE = 'yyyy-MM-dd';

export async function createEuDccVaccinationData(administeredVaccineId, { models, settings }) {
  const {
    Patient,
    ReferenceData,
    AdministeredVaccine,
    Encounter,
    Facility,
    Location,
    ScheduledVaccine,
    CertifiableVaccine,
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
    location,
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

  const facilityName = location?.facility?.name ?? encounterFacilityName;

  const certVax = await CertifiableVaccine.findOne({
    where: {
      vaccineId,
    },
    include: [
      {
        model: ReferenceData,
        as: 'manufacturer',
      },
    ],
  });

  if (!certVax) throw new Error('Vaccine is not certifiable');
  if (!certVax.usableForEuDcc()) throw new Error('Vaccination is not usable for EU DCC');

  const timeZone = await settings.get('countryTimeZone');
  const countryCode = await settings.get('country.alpha-2');

  const dob = formatInTimeZone(patient.dateOfBirth, timeZone, FORMAT_ISODATE);
  const vaxDate = formatInTimeZone(date, timeZone, FORMAT_ISODATE);

  return {
    ver: EUDCC_SCHEMA_VERSION,
    nam: nameSection(patient),
    dob,
    [EUDCC_CERTIFICATE_TYPES.VACCINATION]: [
      {
        tg: certVax.targetCode,
        vp: certVax.vaccineCode,
        mp: certVax.euProductCode,
        ma: certVax.manufacturer.code,
        dn: SCHEDULE_TO_SEQUENCE[schedule],
        sd: certVax.maximumDosage,
        dt: vaxDate,
        co: countryCode,
        is: (await settings.get('integrations.euDcc.issuer')) ?? facilityName,
        ci: generateUVCI(id, { format: 'eudcc', countryCode }),
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
