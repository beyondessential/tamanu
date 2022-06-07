import moment from 'moment';
import { transliterate as tr } from 'transliteration';
import { getLocalisation } from '../../localisation';

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

const METHOD_CODE = {
  GeneXpert: 'antigen',
  RTPCR: 'molecular(PCR)',
  RDT: 'antigen',
};

const MOMENT_FORMAT_ISODATE = 'YYYY-MM-DD';
const MOMENT_FORMAT_RFC3339 = 'YYYY-MM-DDTHH:mm:ssZ';

export const createVdsNcVaccinationData = async (patientId, { models }) => {
  const {
    Patient,
    PatientAdditionalData,
    ReferenceData,
    AdministeredVaccine,
    Encounter,
    Facility,
    Location,
    ScheduledVaccine,
    CertifiableVaccine,
  } = models;

  const countryCode = (await getLocalisation()).country['alpha-3'];

  const { firstName, lastName, dateOfBirth, sex } = await Patient.findOne({
    where: { id: patientId },
  });
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
      scheduledVaccine: {
        schedule,
        vaccine: { name: label, id: vaccineId },
      },
      encounter: {
        location: {
          facility: { name: facility },
        },
      },
    } = dose;

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

    const event = {
      dvc: moment(date)
        .utc()
        .format(MOMENT_FORMAT_ISODATE),
      seq: SCHEDULE_TO_SEQUENCE[schedule],
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
        des: certVax.icd11DrugCode,
        nam: label,
        dis: certVax.icd11DiseaseCode,
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

export const createVdsNcTestData = async (labTestId, { models }) => {
  const {
    Patient,
    PatientAdditionalData,
    LabTest,
    ReferenceData,
    LabRequest,
    Location,
    Encounter,
  } = models;

  const countryCode = (await getLocalisation()).country['alpha-3'];

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
      sc: moment(request.sampleTime)
        .utc()
        .format(MOMENT_FORMAT_RFC3339),
      ri: moment(test.completedDate)
        .utc()
        .format(MOMENT_FORMAT_RFC3339),
    },
    tr: {
      tc: METHOD_CODE[method.code] ?? method.code,
      r: test.result,
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

  const data = {
    n: name,
    dob: moment(dateOfBirth).format(MOMENT_FORMAT_ISODATE),
  };

  if (sex && SEX_TO_CHAR[sex]) {
    data.sex = SEX_TO_CHAR[sex];
  }

  return data;
}
