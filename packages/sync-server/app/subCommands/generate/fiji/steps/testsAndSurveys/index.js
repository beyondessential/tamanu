import moment from 'moment';

import { chance } from '../../../chance';
import { insertEncounter } from '../../insertEncounter';
import { insertSurveyResponse } from './insertSurveyResponse';
import { insertCovidTest } from './insertCovidTest';

export default {
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
};
