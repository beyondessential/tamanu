import { v4 as uuidv4 } from 'uuid';
import Chance from 'chance';

import { fake } from 'shared/test-helpers';
import { ENCOUNTER_TYPES } from 'shared/constants';

import { initDatabase, closeDatabase } from '../../database';
// TODO: import this from the spreadsheet once possible
import * as programData from './program.json';
import { importProgram } from './program';
import { insertSurveyResponse } from './insertSurveyResponse';

const chance = new Chance();

const REPORT_INTERVAL_MS = 100;
const NUM_VILLAGES = 50;
const NUM_EXAMINERS = 10;
const NUM_FACILITIES = 20;

export const generateFiji = async ({ patientCount }) => {
  const store = await initDatabase({ testMode: false });
  const {
    Patient,
    ReferenceData,
    Encounter,
    AdministeredVaccine,
    ScheduledVaccine,
    User,
    Facility,
    Location,
    Department,
  } = store.models;

  const setupData = {
    villageIds: [],
    examinerIds: [],
    facDepLoc: [],
    scheduleIds: [],
  };

  const upsertSetupData = async () => {
    // villages
    for (let i = 0; i < NUM_VILLAGES; i++) {
      const name = chance.name();
      const code = name.toLowerCase();
      const id = `village-${code}-${uuidv4()}`;
      await ReferenceData.create({ id, code, name, type: 'village' });
      setupData.villageIds.push(id);
    }

    // examiners
    for (let i = 0; i < NUM_EXAMINERS; i++) {
      const examiner = await User.create({
        ...fake(User),
        role: 'practitioner',
      });
      setupData.examinerIds.push(examiner.id);
    }

    // facilities/departments/locations
    for (let i = 0; i < NUM_FACILITIES; i++) {
      const facility = await Facility.create(fake(Facility));
      const department = await Department.create({
        ...fake(Department),
        facilityId: facility.id,
      });
      const location = await Location.create({
        ...fake(Location),
        facilityId: facility.id,
      });
      setupData.facDepLoc.push([facility.id, location.id, department.id]);
    }

    // scheduled vaccines (taken from Fiji reference data)
    const [az] = await ReferenceData.upsert(
      {
        id: 'drug-COVAX',
        code: 'COVAX',
        name: 'COVID-19 (AZ)',
        type: 'drug',
      },
      { returning: true },
    );
    for (let dose = 1; dose <= 2; dose++) {
      const [scheduledVaccine] = await ScheduledVaccine.upsert(
        {
          id: `scheduledVaccine-COVID-19-Dose-${dose}`,
          category: 'Campaign',
          label: 'COVID-19',
          schedule: `Dose ${dose}`,
          weeksFromLastVaccinationDue: dose === 1 ? null : 8,
          index: dose,
          vaccineId: az.id,
        },
        { returning: true },
      );
      setupData.scheduleIds.push(scheduledVaccine.id);
    }

    // surveys
    const { program, survey, questions } = await importProgram(store.models, programData);
    setupData.program = program;
    setupData.survey = survey;
    setupData.questions = questions;
  };

  const insertEncounter = async patientId => {
    const [, locationId, departmentId] = chance.pickone(setupData.facDepLoc);
    const encounter = await Encounter.create({
      ...fake(Encounter),
      type: ENCOUNTER_TYPES.CLINIC,
      examinerId: chance.pickone(setupData.examinerIds),
      patientId,
      locationId,
      departmentId,
    });
    return encounter;
  };

  const insertVaccination = async (patientId, scheduledVaccineId) => {
    const encounter = await insertEncounter(patientId);
    await AdministeredVaccine.create({
      ...fake(AdministeredVaccine),
      encounterId: encounter.id,
      scheduledVaccineId,
    });
  };

  const insertPatientData = async () => {
    // patient
    const patient = await Patient.create({
      ...fake(Patient),
      villageId: chance.pickone(setupData.villageIds),
    });

    // vaccines
    const doses = chance.integer({ min: 0, max: 2 });
    if (doses >= 1) {
      await insertVaccination(patient.id, setupData.scheduleIds[0]);
    }
    if (doses >= 2) {
      await insertVaccination(patient.id, setupData.scheduleIds[1]);
    }

    // survey responses
    for (let i = 0; i < chance.integer({ min: 0, max: 4 }); i++) {
      const { id: encounterId } = await insertEncounter(patient.id);
      await insertSurveyResponse(store.sequelize.models, setupData, { encounterId });
    }
  };

  let intervalId;
  try {
    let i = 0;

    const reportProgress = () => {
      // \r works because the length of this is guaranteed to always grow longer or stay the same
      process.stdout.write(`Generating patient ${i}/${patientCount}...\r`);
    };

    // perform the generation
    await store.sequelize.transaction(async () => {
      process.stdout.write('Creating/upserting setup data...\n');
      await upsertSetupData();

      // report progress regularly but don't spam the console
      intervalId = setInterval(reportProgress, REPORT_INTERVAL_MS);
      reportProgress();

      // generate patients
      for (i = 0; i < patientCount; i++) {
        await insertPatientData();
      }

      // finish up
      clearInterval(intervalId);
      reportProgress();
      process.stdout.write('\nCommitting transaction...\n');
    });
    process.stdout.write('Complete\n');
  } finally {
    clearInterval(intervalId);
    await closeDatabase();
  }
};
