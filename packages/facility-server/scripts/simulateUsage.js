const config = require('config');
const Chance = require('chance');
const { v4: uuidv4 } = require('uuid');
const { fake } = require('@tamanu/shared/test-helpers/fake');
const { randomReferenceData } = require('@tamanu/shared/demoData/patients');
const { sleepAsync } = require('@tamanu/shared/utils/sleepAsync');
const { NOTE_RECORD_TYPES, REFERENCE_TYPES } = require('@tamanu/constants');
const { getCurrentDateTimeString } = require('@tamanu/shared/utils/dateTime');

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

const DAY_DURATION_MS = 24 * 60 * 60 * 1000;
const INSERT_INTERVAL_MS = 20000;

// How many times we can split the day in the given interval
const TIMES_PER_DAY = DAY_DURATION_MS / INSERT_INTERVAL_MS;

const chance = new Chance();

async function createPatient(models, facilityId) {
  const { Patient, PatientAdditionalData, PatientFacility } = models;
  const patient = await Patient.create(fake(Patient, { displayId: uuidv4() }));
  await PatientAdditionalData.create(fake(PatientAdditionalData, { patientId: patient.id }));
  await PatientFacility.create({
    id: PatientFacility.generateId(),
    patientId: patient.id,
    facilityId,
  });
  return patient;
}

async function createEncounter(models, facilityId) {
  const { Encounter, Location, Department, User, PatientFacility } = models;

  const location = await Location.findOne({ where: { facilityId } });
  const department = await Department.findOne({ where: { facilityId } });
  const examiner = await User.findOne();
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

async function createProgramSurveyResponse(models, facilityId) {
  const { Encounter, PatientFacility, Survey, SurveyResponse, SurveyScreenComponent } = models;
  const survey = await Survey.findOne();
  const ssc = await SurveyScreenComponent.findOne({ where: { surveyId: survey.id } });
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const response = await SurveyResponse.createWithAnswers({
    patientId: patientFacility.patientId,
    encounterId: encounter.id,
    surveyId: survey.id,
    answers: {
      [ssc.dataElementId]: chance.string(),
    },
  });

  return response;
}

async function createNote(models, facilityId) {
  const { Encounter, Note, PatientFacility, User } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const author = await User.findOne();

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
  const procedureType = randomReferenceData(models, REFERENCE_TYPES.PROCEDURE_TYPE);

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
  const { AdministeredVaccine, Encounter, PatientFacility, ScheduledVaccine } = models;
  const patientFacility = await PatientFacility.findOne({ where: { facilityId } });
  const encounter = await Encounter.findOne({ where: { patientId: patientFacility.patientId } });
  const scheduledVaccine = await ScheduledVaccine.findOne();

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

/*
  Appointment: 448,
  ImagingRequest: 32,
  ImagingResult: 30,
  LabTest: 530,
  PatientBirthData: 6,
  PatientCommunication: 3,
  PatientCondition: 32,
  Referral: 3,
  SurveyResponseAnswer: 9439,
  Triage: 14,
*/



// Likelihood should be a percentage number so from 0 to 100
function calculateLikelihood(modelName, ratio = 1) {
  const dailyTotal = DAILY_CREATION_STATS[modelName];
  if (!dailyTotal) throw new Error(`Invalid stat for model ${modelName}`);
  return ratio * 100 * (dailyTotal / TIMES_PER_DAY);
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
};
const ACTIONS_ENTRIES = Object.entries(ACTIONS);

function startOrAdd(key, obj) {
  if (obj[key]) {
    obj[key]++;
  } else {
    obj[key] = 1;
  }
}

async function simulateUsage(models, sequelize, hours = 1) {
  const facilityId = config.serverFacilityId;
  const totalLoops = hours * 60 * 60 * 1000 / INSERT_INTERVAL_MS;
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
// Usage (note that if you -await- the function you WILL NOT be able to cancel it until it's done!):
// const { simulateUsage } = require('@tamanu/facility-server/scripts/simulateUsage.js');
// // This will run for one hour (well, a bit longer but for simplicity sake, around that)
// await simulateUsage(models, context.sequelize);

module.exports = {
  simulateUsage: simulateUsage,
};
