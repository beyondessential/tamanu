import moment from 'moment';
import { REFERENCE_TYPES } from 'shared/constants';
import { log } from 'shared/services/logging';

const getCountryCode = () => 'FJI';

const generateUniqueCode = () => 'asdfghjkl;asdfgh';

const getFacilityName = patientId => 'asdfghjkl;asdfgh';

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

export const createProofOfVax = async (models, patientId) => {
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
    data: {
      // header
      hdr: {
        t: 'icao.vacc',
        v: 1,
        is: getCountryCode(),
      },
      msg: {
        utci: generateUniqueCode(),
        pid: {
          // This field can only be 39 characters long, just truncate the name
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
      },
      sig: {
        alg: 'ES256',
        cert: 'idk',
        sigvl: 'idk',
      },
    },
  };
};

export const createProofOfTest = patientId => {
  const { firstName, lastName, dateOfBirth } = patient;
  const { passport } = additionalData;

  return {
    data: {
      // header
      hdr: {
        t: 'icao.vacc',
        v: 1,
        is: getCountryCode(),
      },
      msg: {
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
      },
    },
  };
};
