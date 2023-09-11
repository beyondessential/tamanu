import React from 'react';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryFormHistory } from '../app/views/programRegistry/ProgramRegistryFormHistory';

import { ApiContext } from '../app/api';
const dummyData = [
  {
    id: 1,
    endTime: '2023-09-07 15:54:00',
    userId: '10',
    user: {
      displayName: 'Hyacinthie',
    },
    surveyId: '100000',
    survey: {
      name: 'Engineering',
    },
    result: '9851',
    resultText: '9851',
  },
  {
    id: 2,
    endTime: '2023-09-07 15:54:00',
    userId: '20',
    user: {
      displayName: 'Mame',
    },
    surveyId: '200000',
    survey: {
      name: 'Marketing',
    },
    result: '1160',
    resultText: '1160',
  },
  {
    id: 3,
    endTime: '2023-09-07 15:54:00',
    userId: '30',
    user: {
      displayName: 'Orland',
    },
    surveyId: '300000',
    survey: {
      name: 'Product Management',
    },
    result: '3634',
    resultText: '3634',
  },
  {
    id: 4,
    endTime: '2023-09-07 15:54:00',
    userId: '40',
    user: {
      displayName: 'Noell',
    },
    surveyId: '400000',
    survey: {
      name: 'Engineering',
    },
    result: '8025',
    resultText: '8025',
  },
  {
    id: 5,
    endTime: '2023-09-07 15:54:00',
    userId: '50',
    user: {
      displayName: 'Hinda',
    },
    surveyId: '500000',
    survey: {
      name: 'Services',
    },
    result: '9631',
    resultText: '9631',
  },
  {
    id: 6,
    endTime: '2023-09-07 15:54:00',
    userId: '60',
    user: {
      displayName: 'Abbey',
    },
    surveyId: '600000',
    survey: {
      name: 'Marketing',
    },
    result: '6816',
    resultText: '6816',
  },
  {
    id: 7,
    endTime: '2023-09-07 15:54:00',
    userId: '70',
    user: {
      displayName: 'Ginelle',
    },
    surveyId: '700000',
    survey: {
      name: 'Human Resources',
    },
    result: '4687',
    resultText: '4687',
  },
  {
    id: 8,
    endTime: '2023-09-07 15:54:00',
    userId: '80',
    user: {
      displayName: 'Vaughn',
    },
    surveyId: '800000',
    survey: {
      name: 'Business Development',
    },
    result: '9343',
    resultText: '9343',
  },
  {
    id: 9,
    endTime: '2023-09-07 15:54:00',
    userId: '90',
    user: {
      displayName: 'Raddie',
    },
    surveyId: '900000',
    survey: {
      name: 'Legal',
    },
    result: '3987',
    resultText: '3987',
  },
  {
    id: 10,
    endTime: '2023-09-07 15:54:00',
    userId: '00',
    user: {
      displayName: 'Donni',
    },
    surveyId: '000000',
    survey: {
      name: 'Accounting',
    },
    result: '9429',
    resultText: '9429',
  },
  {
    id: 11,
    endTime: '2023-09-07 15:54:00',
    userId: '10',
    user: {
      displayName: 'Laurens',
    },
    surveyId: '100000',
    survey: {
      name: 'Support',
    },
    result: '8660',
    resultText: '8660',
  },
  {
    id: 12,
    endTime: '2023-09-07 15:54:00',
    userId: '20',
    user: {
      displayName: 'Linette',
    },
    surveyId: '200000',
    survey: {
      name: 'Research and Development',
    },
    result: '5142',
    resultText: '5142',
  },
  {
    id: 13,
    endTime: '2023-09-07 15:54:00',
    userId: '30',
    user: {
      displayName: 'Gnni',
    },
    surveyId: '300000',
    survey: {
      name: 'Human Resources',
    },
    result: '8082',
    resultText: '8082',
  },
  {
    id: 14,
    endTime: '2023-09-07 15:54:00',
    userId: '40',
    user: {
      displayName: 'Dexter',
    },
    surveyId: '400000',
    survey: {
      name: 'Human Resources',
    },
    result: '8847',
    resultText: '8847',
  },
  {
    id: 15,
    endTime: '2023-09-07 15:54:00',
    userId: '50',
    user: {
      displayName: 'Ulberto',
    },
    surveyId: '500000',
    survey: {
      name: 'Human Resources',
    },
    result: '9859',
    resultText: '9859',
  },
  {
    id: 16,
    endTime: '2023-09-07 15:54:00',
    userId: '60',
    user: {
      displayName: 'Northrup',
    },
    surveyId: '600000',
    survey: {
      name: 'Training',
    },
    result: '9104',
    resultText: '9104',
  },
  {
    id: 17,
    endTime: '2023-09-07 15:54:00',
    userId: '70',
    user: {
      displayName: 'Aland',
    },
    surveyId: '700000',
    survey: {
      name: 'Support',
    },
    result: '0359',
    resultText: '0359',
  },
  {
    id: 18,
    endTime: '2023-09-07 15:54:00',
    userId: '80',
    user: {
      displayName: 'Benoite',
    },
    surveyId: '800000',
    survey: {
      name: 'Business Development',
    },
    result: '3798',
    resultText: '3798',
  },
  {
    id: 19,
    endTime: '2023-09-07 15:54:00',
    userId: '90',
    user: {
      displayName: 'Daloris',
    },
    surveyId: '900000',
    survey: {
      name: 'Legal',
    },
    result: '2099',
    resultText: '2099',
  },
  {
    id: 20,
    endTime: '2023-09-07 15:54:00',
    userId: '00',
    user: {
      displayName: 'Anstice',
    },
    surveyId: '000000',
    survey: {
      name: 'Sales',
    },
    result: '6693',
    resultText: '6693',
  },
];
function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

const dummyApi = {
  get: async (endpoint, { order, orderBy, page, rowsPerPage }) => {
    console.log(endpoint);
    await sleep(1000);
    const sortedData = dummyData.sort(({ [orderBy]: a }, { [orderBy]: b }) => {
      if (typeof a === 'string') {
        return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      }
      return order === 'asc' ? a - b : b - a;
    });
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return {
      data: sortedData.slice(startIndex, endIndex),
      count: dummyData.length,
    };
  },
};
storiesOf('Program Registry', module).add('ProgramRegistryFormHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryFormHistory
      programRegistry={{
        id: '23242234234',
      }}
      patient={{
        id: '23242234234',
      }}
    />
  </ApiContext.Provider>
));
