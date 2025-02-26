import config from 'config';
import Chance from 'chance';
import { v4 as uuidv4 } from 'uuid';
import { fake } from '@tamanu/fake-data/fake';
import { randomReferenceData } from '@tamanu/database/demoData/patients';
import { randomRecord } from '@tamanu/database/demoData/utilities';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import {
  NOTE_RECORD_TYPES,
  REFERENCE_TYPES,
  IMAGING_TYPES_VALUES,
  IMAGING_REQUEST_STATUS_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

// These stats were gathered by the data team from three different deployments,
// then, we grabbed the max on each model.
// Even though not all stats are being used, they might be handy to have around
const DAILY_CREATION_STATS = {
  AdministeredVaccine: 551,
  Appointment: 448,
  Encounter: 930,
  ImagingRequest: 32,
  ImagingResult: 30,
  LabTest: 530,
  Note: 1700,
  PatientBirthData: 6,
  PatientCommunication: 3,
  PatientCondition: 32,
  Patient: 51,
  Procedure: 555,
  Referral: 3,
  SurveyResponse: 710,
  SurveyResponseAnswer: 9439,
  Triage: 14,
};

const DAILY_UPDATE_STATS = {
  AdministeredVaccine: 37,
  Appointment: 336,
  Encounter: 391,
  ImagingRequest: 22,
  ImagingResult: 0,
  LabTest: 323,
  Note: 2,
  PatientBirthData: 1,
  PatientCommunication: 8,
  PatientCondition: 2,
  Patient: 64,
  Procedure: 7,
  Referral: 1,
  SurveyResponse: 0,
  SurveyResponseAnswer: 16,
  Triage: 33,
};

const DAY_DURATION_MS = 24 * 60 * 60 * 1000;
const INSERT_INTERVAL_MS = 20000;

// How many times we can split the day in the given interval
const TIMES_PER_DAY = DAY_DURATION_MS / INSERT_INTERVAL_MS;

// Bumping this will vamp up the amount of records. Note that 2 means twice the records!
const RATIO = 1;

const chance = new Chance();

async function updateRecord(model) {
  await model.sequelize.query(`
    UPDATE ${model.tableName}
    SET updated_at = now()
    WHERE id = (SELECT id FROM ${model.tableName} ORDER BY random() LIMIT 1);
  `);
}

async function createPatient(models) {
  const { Patient, PatientAdditionalData } = models;
  const patient = await Patient.create(fake(Patient, { displayId: uuidv4() }));
  await PatientAdditionalData.create(fake(PatientAdditionalData, { patientId: patient.id }));

  return patient;
}

async function createEncounter(models, facilityId) {
  const { Encounter, Location, Department, PatientFacility } = models;

  const location = await Location.findOne({ where: { facilityId } });
  const department = await Department.findOne({ where: { facilityId } });
  const examiner = await randomRecord(models, 'User');
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.create(
    fake(Encounter, {
      locationId: location.id,
      departmentId: department.id,
      examinerId: examiner.id,
      patientId: patientFacility.patientId,
    }),
  );

  return encounter;
}

// Shortened list that is easier to support
const SIMPLE_PDE_TYPES_HANDLERS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: chance.word,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: getCurrentDateTimeString,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: chance.natural,
};

async function createProgramSurveyResponse(models, facilityId) {
  const { Encounter, PatientFacility, SurveyResponse, SurveyScreenComponent } = models;
  const survey = await randomRecord(models, 'Survey');
  const sscs = await SurveyScreenComponent.findAll({
    where: { surveyId: survey.id, validationCriteria: null },
    include: { association: 'dataElement' },
  });
  const answers = {};
  sscs
    .filter((ssc) => ssc.dataElement.type in SIMPLE_PDE_TYPES_HANDLERS)
    .forEach((ssc) => {
      answers[ssc.dataElement.id] = SIMPLE_PDE_TYPES_HANDLERS[ssc.dataElement.type]();
    });

  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const response = await SurveyResponse.createWithAnswers({
    patientId: patientFacility.patientId,
    encounterId: encounter.id,
    surveyId: survey.id,
    answers,
  });

  return response;
}

async function createNote(models, facilityId) {
  const { Encounter, Note, PatientFacility } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const author = await randomRecord(models, 'User');

  const note = await Note.create(
    fake(Note, {
      recordId: encounter.id,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      content: chance.paragraph({ sentences: chance.natural({ min: 1, max: 20 }) }),
      authorId: author.id,
    }),
  );

  return note;
}

async function createProcedure(models, facilityId) {
  const { Encounter, PatientFacility, Procedure } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const procedureType = await randomReferenceData(models, REFERENCE_TYPES.PROCEDURE_TYPE);

  const procedure = await Procedure.create(
    fake(Procedure, {
      encounterId: encounter.id,
      procedureTypeId: procedureType.id,
      locationId: encounter.locationId,
      date: getCurrentDateTimeString(),
      note: chance.sentence(),
      completedNote: chance.sentence(),
    }),
  );

  return procedure;
}

async function createAdministeredVaccine(models, facilityId) {
  const { AdministeredVaccine, Encounter, PatientFacility } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const scheduledVaccine = await randomRecord(models, 'ScheduledVaccine');

  const administeredVaccine = await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      status: 'GIVEN',
      date: getCurrentDateTimeString(),
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
  );

  return administeredVaccine;
}

async function createAppointment(models, facilityId) {
  const { Appointment, Location, PatientFacility } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const location = await Location.findOne({ where: { facilityId } });
  const clinician = await randomRecord(models, 'User');

  const appointment = await Appointment.create(
    fake(Appointment, {
      startTime: getCurrentDateTimeString(),
      patientId: patientFacility.patientId,
      clinicianId: clinician.id,
      locationId: location.id,
    }),
  );

  return appointment;
}

async function createLabTest(models, facilityId) {
  const { Encounter, LabRequest, LabTest, LabTestType, PatientFacility } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const labTestLaboratory = await randomReferenceData(models, REFERENCE_TYPES.LAB_TEST_LABORATORY);
  const labTestCategory = await randomReferenceData(models, REFERENCE_TYPES.LAB_TEST_CATEGORY);
  const labTestMethod = await randomReferenceData(models, REFERENCE_TYPES.LAB_TEST_METHOD);
  const labTestType = await LabTestType.findOne({
    where: {
      labTestCategoryId: labTestCategory.id,
    },
  });

  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      encounterId: encounter.id,
      labTestLaboratoryId: labTestLaboratory.id,
      labTestCategoryId: labTestCategory.id,
      status: 'published',
    }),
  );

  const labTest = await LabTest.create(
    fake(LabTest, {
      labTestTypeId: labTestType.id,
      labRequestId: labRequest.id,
      labTestMethodId: labTestMethod.id,
      categoryId: labTestCategory.id,
      result: 'Negative',
    }),
  );

  return labTest;
}

async function createImagingRequest(models, facilityId) {
  const { Encounter, ImagingRequest, Location, PatientFacility } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const location = await Location.findOne({ where: { facilityId } });
  const clinician = await randomRecord(models, 'User');

  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: clinician.id,
      encounterId: encounter.id,
      locationId: location.id,
      priority: 'routine',
      imagingType: chance.pickone(IMAGING_TYPES_VALUES),
    }),
  );

  if (imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED) {
    await models.ImagingResult.create({
      completedAt: getCurrentDateTimeString(),
      imagingRequestId: imagingRequest.id,
      description: chance.sentence(),
      completedById: clinician.id,
    });
  }

  return imagingRequest;
}

async function createPatientCondition(models, facilityId) {
  const { PatientFacility, PatientCondition } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const condition = await randomReferenceData(models, REFERENCE_TYPES.DIAGNOSIS);

  const patientCondition = await PatientCondition.create({
    conditionId: condition.id,
    patientId: patientFacility.patientId,
    note: chance.sentence(),
  });

  return patientCondition;
}

// Likelihood should be a percentage number so from 0 to 100
function calculateLikelihood(modelName, isCreate = true) {
  const STATS_CONST = isCreate ? DAILY_CREATION_STATS : DAILY_UPDATE_STATS;
  const dailyTotal = STATS_CONST[modelName];
  if (!dailyTotal) throw new Error(`Invalid stat for model ${modelName}`);
  return RATIO * 100 * (dailyTotal / TIMES_PER_DAY);
}

const ACTIONS = {
  newPatient: {
    likelihood: calculateLikelihood('Patient'),
    generator: createPatient,
  },
  newEncounter: {
    likelihood: calculateLikelihood('Encounter'),
    generator: createEncounter,
  },
  newSurveyResponse: {
    likelihood: calculateLikelihood('SurveyResponse'),
    generator: createProgramSurveyResponse,
  },
  newNote: {
    likelihood: calculateLikelihood('Note'),
    generator: createNote,
  },
  newProcedure: {
    likelihood: calculateLikelihood('Procedure'),
    generator: createProcedure,
  },
  newAdministeredVaccine: {
    likelihood: calculateLikelihood('AdministeredVaccine'),
    generator: createAdministeredVaccine,
  },
  newAppointment: {
    likelihood: calculateLikelihood('Appointment'),
    generator: createAppointment,
  },
  newLabTest: {
    likelihood: calculateLikelihood('LabTest'),
    generator: createLabTest,
  },
  newImagingRequest: {
    likelihood: calculateLikelihood('ImagingRequest'),
    generator: createImagingRequest,
  },
  newPatientCondition: {
    likelihood: calculateLikelihood('PatientCondition'),
    generator: createPatientCondition,
  },
  updateAdministeredVaccine: {
    likelihood: calculateLikelihood('AdministeredVaccine', false),
    generator: async (models) => updateRecord(models.AdministeredVaccine),
  },
  updateAppointment: {
    likelihood: calculateLikelihood('Appointment', false),
    generator: async (models) => updateRecord(models.Appointment),
  },
  updateEncounter: {
    likelihood: calculateLikelihood('Encounter', false),
    generator: async (models) => updateRecord(models.Encounter),
  },
  updateImagingRequest: {
    likelihood: calculateLikelihood('ImagingRequest', false),
    generator: async (models) => updateRecord(models.ImagingRequest),
  },
  updateLabTest: {
    likelihood: calculateLikelihood('LabTest', false),
    generator: async (models) => updateRecord(models.LabTest),
  },
  updatePatient: {
    likelihood: calculateLikelihood('Patient', false),
    generator: async (models) => updateRecord(models.Patient),
  },
};
const ACTIONS_ENTRIES = Object.entries(ACTIONS);

function startOrAdd(key, obj) {
  if (obj[key]) {
    obj[key]++;
  } else {
    obj[key] = 1;
  }
}

export async function simulateUsage(models, sequelize, hours = 1) {
  const [facilityId] = selectFacilityIds(config);
  const totalLoops = (hours * 60 * 60 * 1000) / INSERT_INTERVAL_MS;
  const actionsTaken = {};

  for (let i = 0; i < totalLoops; i++) {
    let successfulActions = 0;
    for (const [actionName, actionProps] of ACTIONS_ENTRIES) {
      const { likelihood, generator } = actionProps;
      if (chance.bool({ likelihood })) {
        try {
          await sequelize.transaction(async () => {
            await generator(models, facilityId);
            successfulActions++;
            startOrAdd(actionName, actionsTaken);
          });
        } catch (e) {
          console.log(e);
        }
      }
    }

    console.log(`Successful actions: ${successfulActions}`);

    // Do every X seconds to spread records evenly
    await sleepAsync(INSERT_INTERVAL_MS);
  }

  console.log(`Finished usage simulation. Ran for ${hours} hours in ${totalLoops} loops.`);
  console.log(JSON.stringify(actionsTaken));
}

// IMPORTANT NOTE: YOU SHOULD NEVER RUN THIS IN A PRODUCTION ENVIRONMENT
// AS IT WILL INTRODUCE MOCK RECORDS INTO THE DATABASE.

/*
  Usage (note that if you -await- the function you WILL NOT be able to cancel it until it's done!),
  also, this example will run for one hour (well, a bit longer but for simplicity sake an hour)
  const { simulateUsage } = require('@tamanu/facility-server/scripts/simulateUsage.js');
  await simulateUsage(models, context.sequelize);
*/
