import { formatInTimeZone } from 'date-fns-tz';
import { transliterate as tr } from 'transliteration';
import { log } from '@tamanu/shared/services/logging';

const SEX_TO_CHAR = {
  male: 'M',
  female: 'F',
  other: 'O',
};

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

const METHOD_CODE = {
  GeneXpert: 'antigen',
  RTPCR: 'molecular(PCR)',
  RDT: 'antigen',
};

const DATE_FORMAT_ISODATE = 'yyyy-MM-dd';
const DATE_FORMAT_RFC3339 = "yyyy-MM-dd'T'HH:mm:ssxxx";

export const createVdsNcVaccinationData = async (patientId, { models, settings }) => {
  const {
    Patient,
    PatientAdditionalData,
    ReferenceData,
    Encounter,
    Facility,
    Location,
    ScheduledVaccine,
    CertifiableVaccine,
  } = models;

  const countryCode = await settings.get('country.alpha-3');
  const timeZone = await settings.get('countryTimeZone');

  const patient = await Patient.findOne({
    where: { id: patientId },
  });

  const { firstName, lastName, dateOfBirth, sex } = patient;
  const pad = await PatientAdditionalData.findOne({ where: { patientId } });
  const passport = pad?.passport;

  const { data: vaccinations } = await patient.getAdministeredVaccines({
    order: [['date', 'ASC']],
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

  log.debug('Translating VDS', {
    patientId,
    vaccinationCount: vaccinations.length,
  });

  if (vaccinations.length === 0) throw new Error('Patient does not have any vaccinations');

  const pidDoc = passport
    ? {
        i: passport,
      }
    : {};

  // Group by vaccine brand/label
  const vaccines = new Map();
  for (const dose of vaccinations) {
    const {
      batch,
      date,
      location,
      scheduledVaccine: {
        schedule,
        vaccine: { name: label, id: vaccineId },
      },
      encounter: {
        location: {
          facility: { name: encounterFacilityName },
        },
      },
    } = dose;

    const sublog = log.child({
      administeredVaccineId: dose.id,
      vaccineRefId: vaccineId,
    });

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
    if (!certVax) {
      sublog.debug('Vaccine is not certifiable');
      continue;
    }

    const event = {
      dvc: formatInTimeZone(date, timeZone, DATE_FORMAT_ISODATE),
      seq: SCHEDULE_TO_SEQUENCE[schedule],
      ctr: countryCode,
      lot: batch || 'Unknown', // If batch number was not recorded, we add a indicative string value to complete ICAO validation
      adm: facilityName,
    };
    sublog.debug('Event for vaccine', { event });

    if (vaccines.has(label)) {
      sublog.debug('Adding to existing brand/label group', { label });
      const vax = vaccines.get(label);
      vax.vd.push(event);
      vaccines.set(label, vax);
    } else {
      sublog.debug('Adding to new brand/label group', { label });
      vaccines.set(label, {
        des: certVax.icd11DrugCode,
        nam: label,
        dis: certVax.icd11DiseaseCode,
        vd: [event],
      });
    }
  }

  log.debug('Translated VDS', {
    patientId,
    vaccinationCount: vaccines.size,
  });

  if (vaccines.size === 0) throw new Error('No certifiable vaccines for patient');

  return {
    pid: {
      ...pid(firstName, lastName, dateOfBirth, sex),
      ...pidDoc,
    },
    ve: [...vaccines.values()],
  };
};

export const createVdsNcTestData = async (labTestId, { models, settings }) => {
  const {
    Patient,
    PatientAdditionalData,
    LabTest,
    ReferenceData,
    LabRequest,
    Location,
    Encounter,
  } = models;

  const countryCode = await settings.get('country.alpha-3');

  const test = await LabTest.findOne({
    where: {
      id: labTestId,
    },
    include: [
      {
        model: ReferenceData,
        as: 'labTestMethod',
      },
      {
        model: LabRequest,
        as: 'labRequest',
        include: [
          {
            model: Encounter,
            as: 'encounter',
            include: [
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
              {
                model: Location,
                as: 'location',
                include: ['facility'],
              },
            ],
          },
        ],
      },
    ],
  });

  const { labTestMethod: method, labRequest: request } = test;

  const {
    location: { facility },
    patient: {
      firstName,
      lastName,
      dateOfBirth,
      sex,
      additionalData: [{ passport }],
    },
  } = request.encounter;

  const pidDoc = passport
    ? {
        dt: 'P',
        dn: passport,
      }
    : {};

  return {
    pid: {
      ...pid(firstName, lastName, dateOfBirth, sex),
      ...pidDoc,
    },
    sp: {
      spn: facility.name,
      ctr: countryCode,
      cd: {
        p: facility.contactNumber,
        e: facility.email,
        a: `${facility.streetAddress}, ${facility.cityTown}`,
      },
    },
    dat: {
      sc: formatInTimeZone(request.sampleTime, 'UTC', DATE_FORMAT_RFC3339),
      ri: formatInTimeZone(new Date(test.completedDate), 'UTC', DATE_FORMAT_RFC3339),
    },
    tr: {
      tc: METHOD_CODE[method.code] ?? method.code,
      r: test.result,
    },
  };
};

function pid(firstName, lastName, dob, sex) {
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
    dob,
  };

  if (sex && SEX_TO_CHAR[sex]) {
    data.sex = SEX_TO_CHAR[sex];
  }

  return data;
}
