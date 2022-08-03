import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import asyncPool from 'tiny-async-pool';

import { fake } from 'shared/test-helpers';
import { ENCOUNTER_TYPES, REFERENCE_TYPES } from 'shared/constants';

import { initDatabase, closeDatabase } from '../../../database';
// TODO (TAN-1529): import this from the spreadsheet once possible
import * as programData from './program.json';
import { importProgram } from './program';
import { insertSurveyResponse } from './insertSurveyResponse';
import { insertCovidTest } from './insertCovidTest';
import { chance, seed } from './chance';

const REPORT_INTERVAL_MS = 100;
const NUM_VILLAGES = 50;
const NUM_EXAMINERS = 10;
const NUM_FACILITIES = 20;
const CONCURRENT_PATIENT_INSERTS = 4;

function range(n) {
  return Array(n)
    .fill()
    .map((_, i) => i);
}

export const generateFiji = async ({ patientCount: patientCountStr }) => {
  const patientCount = Number.parseInt(patientCountStr, 10);
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
      const name = chance.city();
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
      setupData.facDepLoc.push([facility.id, department.id, location.id]);
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

    // lab test categories
    const [covidCategory] = await ReferenceData.upsert(
      {
        id: 'labTestCategory-COVID',
        code: 'COVID',
        name: 'COVID-19 Swab',
        type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      },
      { returning: true },
    );
    setupData.covidTestCategories = [covidCategory.id]; // report specifies multiple but workbook only has one
  };

  const insertEncounter = async patientId => {
    const [, departmentId, locationId] = chance.pickone(setupData.facDepLoc);
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

    // lab tests
    const testDates = [];
    for (let i = 0; i < chance.integer({ min: 0, max: 3 }); i++) {
      const { id: encounterId } = await insertEncounter(patient.id);
      const test = await insertCovidTest(store.sequelize.models, setupData, { encounterId });
      testDates.push(test.date);
    }

    // survey responses
    for (const testDate of testDates) {
      for (let i = 0; i < chance.integer({ min: 0, max: 2 }); i++) {
        const { id: encounterId } = await insertEncounter(patient.id);
        const startTime = moment(testDate)
          .add(chance.integer({ min: 1, max: 6 }), 'days')
          .add(chance.integer({ min: 1, max: 12 }), 'hours');
        await insertSurveyResponse(store.sequelize.models, setupData, { encounterId, startTime });
      }
    }
  };

  let intervalId;
  try {
    let complete = 0;

    let startMs = null;
    const reportProgress = () => {
      // \r works because the length of this is guaranteed to always grow longer or stay the same
      const pct = ((complete / patientCount) * 100).toFixed(2);
      const perSecond = startMs ? (complete / ((Date.now() - startMs) / 1000)).toFixed(2) : '-';
      process.stdout.write(
        `\rGenerating patient ${complete}/${patientCount} (${pct}% | ${perSecond}/sec)...`,
      );
    };

    // perform the generation
    process.stdout.write(`Creating/upserting setup data (seed=${seed})...\n`);
    await upsertSetupData();

    // report progress regularly but don't spam the console
    intervalId = setInterval(reportProgress, REPORT_INTERVAL_MS);
    reportProgress();

    // generate patients
    startMs = Date.now();
    await asyncPool(CONCURRENT_PATIENT_INSERTS, range(patientCount), async () => {
      await store.sequelize.transaction(async () => {
        await insertPatientData();
      });
      complete++;
    });

    // finish up
    clearInterval(intervalId);
    reportProgress();
    process.stdout.write('\nComplete\n');
  } finally {
    clearInterval(intervalId);
    await closeDatabase();
  }
};
