import moment from 'moment';

import { fake } from 'shared/test-helpers';
import { ENCOUNTER_TYPES, REFERENCE_TYPES } from 'shared/constants';

// TODO (TAN-1529): import this from the spreadsheet once possible
import * as programData from '../program.json';
import { importProgram } from '../program';
import { insertSurveyResponse } from '../insertSurveyResponse';
import { insertCovidTest } from '../insertCovidTest';
import { chance } from '../../chance';

const NUM_VILLAGES = 50;
const NUM_EXAMINERS = 10;
const NUM_FACILITIES = 20;

const insertEncounter = async (store, setupData, patientId) => {
  const { Encounter } = store.models;
  const [, department, location] = chance.pickone(setupData.facilitiesDepartmentsAndLocations);
  const encounter = await Encounter.create({
    ...fake(Encounter),
    type: ENCOUNTER_TYPES.CLINIC,
    examinerId: chance.pickone(setupData.examiners).id,
    patientId,
    locationId: location.id,
    departmentId: department.id,
  });
  return encounter;
};

const REF_ID_PREFIX = 'tamanuFijiGenerate';

export const STEPS = {
  // SETUP steps may be specified as dependencies of other steps, not run directly
  SETUP: {
    villages: {
      run: async store => {
        const { ReferenceData } = store.models;
        const villages = [];
        for (let i = 0; i < NUM_VILLAGES; i++) {
          const name = chance.city();
          const code = name.toLowerCase();
          const id = `${REF_ID_PREFIX}-village-${i}`;
          const village = await ReferenceData.upsert(
            { id, code, name, type: 'village' },
            { returning: true },
          );
          villages.push(village);
        }
        return villages;
      },
    },
    examiners: {
      run: async store => {
        const { User } = store.models;
        const examiners = [];
        for (let i = 0; i < NUM_EXAMINERS; i++) {
          const examiner = await User.upsert(
            {
              ...fake(User),
              role: 'practitioner',
              id: `${REF_ID_PREFIX}-user-${i}`,
            },
            { returning: true },
          );
          examiners.push(examiner);
        }
        return examiners;
      },
    },
    facilitiesDepartmentsAndLocations: {
      run: async store => {
        const { Facility, Department, Location } = store.models;
        const facDepLoc = [];
        for (let i = 0; i < NUM_FACILITIES; i++) {
          const [facility] = await Facility.upsert(
            {
              ...fake(Facility),
              id: `${REF_ID_PREFIX}-facility-${i}`,
            },
            { returning: true },
          );
          const [department] = await Department.upsert(
            {
              ...fake(Department),
              id: `${REF_ID_PREFIX}-department-${i}`,
              facilityId: facility.id,
            },
            { returning: true },
          );
          const [location] = await Location.upsert(
            {
              ...fake(Location),
              id: `${REF_ID_PREFIX}-location-${i}`,
              facilityId: facility.id,
            },
            { returning: true },
          );
          facDepLoc.push([facility, department, location]);
        }
        return facDepLoc;
      },
    },
    scheduledVaccines: {
      run: async store => {
        const { ReferenceData, ScheduledVaccine } = store.models;
        const [az] = await ReferenceData.upsert(
          {
            id: 'drug-COVAX',
            code: 'COVAX',
            name: 'COVID-19 (AZ)',
            type: 'drug',
          },
          { returning: true },
        );
        const scheduledVaccines = [];
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
          scheduledVaccines.push(scheduledVaccine);
        }
        return scheduledVaccines;
      },
    },
    programSurveyAndQuestions: {
      run: store => importProgram(store.models, programData),
    },
    labTestCategories: {
      run: async store => {
        const { ReferenceData } = store.models;
        const [covidCategory] = await ReferenceData.upsert(
          {
            id: 'labTestCategory-COVID',
            code: 'COVID',
            name: 'COVID-19 Swab',
            type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
          },
          { returning: true },
        );
        return [covidCategory]; // report specifies multiple but workbook only has one
      },
    },
  },
  // PATIENT step is special and runs before PER_PATIENT steps
  // must return a patient
  PATIENT: {
    setup: ['villages'],
    run: (store, setupData) => {
      const { Patient } = store.models;
      return Patient.create({
        ...fake(Patient),
        villageId: chance.pickone(setupData.villages).id,
      });
    },
  },
  // PER_PATIENT steps are run after each patient is created and receive the patient's id
  PER_PATIENT: {
    // additionalData: async (patientId, setupData) => {
    // },
    administeredVaccines: {
      setup: ['examiners', 'facilitiesDepartmentsAndLocations', 'scheduledVaccines'],
      run: async (store, setupData, patientId) => {
        const { AdministeredVaccine } = store.models;
        const insertVaccination = async scheduledVaccineId => {
          const encounter = await insertEncounter(store, setupData, patientId);
          await AdministeredVaccine.create({
            ...fake(AdministeredVaccine),
            encounterId: encounter.id,
            scheduledVaccineId,
          });
        };
        const doses = chance.integer({ min: 0, max: 2 });
        if (doses >= 1) {
          await insertVaccination(setupData.scheduledVaccines[0].id);
        }
        if (doses >= 2) {
          await insertVaccination(setupData.scheduledVaccines[1].id);
        }
      },
    },
    testsAndSurveys: {
      setup: [
        'examiners',
        'facilitiesDepartmentsAndLocations',
        'labTestCategories',
        'programSurveyAndQuestions',
        'villages',
      ],
      run: async (store, setupData, patientId) => {
        const testDates = [];
        for (let i = 0; i < chance.integer({ min: 0, max: 3 }); i++) {
          const { id: encounterId } = await insertEncounter(store, setupData, patientId);
          const test = await insertCovidTest(store.sequelize.models, setupData, { encounterId });
          testDates.push(test.date);
        }

        // survey responses
        for (const testDate of testDates) {
          for (let i = 0; i < chance.integer({ min: 0, max: 2 }); i++) {
            const { id: encounterId } = await insertEncounter(store, setupData, patientId);
            const startTime = moment(testDate)
              .add(chance.integer({ min: 1, max: 6 }), 'days')
              .add(chance.integer({ min: 1, max: 12 }), 'hours');
            await insertSurveyResponse(store.sequelize.models, setupData, {
              encounterId,
              startTime,
            });
          }
        }
      },
    },
  },
};
