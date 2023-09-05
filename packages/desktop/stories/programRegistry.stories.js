import React from 'react';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';

import { ApiContext } from '../app/api';
const dummyData = [
  {
    id: '1',
    statusId: '1',
    status: {
      id: '1',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '1',
    clinician: {
      id: '1',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '2',
    statusId: '2',
    status: {
      id: '2',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '2',
    clinician: {
      id: '2',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '3',
    statusId: '3',
    status: {
      id: '3',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '3',
    clinician: {
      id: '3',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '4',
    statusId: '4',
    status: {
      id: '4',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '4',
    clinician: {
      id: '4',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '5',
    statusId: '5',
    status: {
      id: '5',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '5',
    clinician: {
      id: '5',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '6',
    statusId: '6',
    status: {
      id: '6',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '6',
    clinician: {
      id: '6',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '7',
    statusId: '7',
    status: {
      id: '7',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '7',
    clinician: {
      id: '7',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '8',
    statusId: '8',
    status: {
      id: '8',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '8',
    clinician: {
      id: '8',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '9',
    statusId: '9',
    status: {
      id: '9',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '9',
    clinician: {
      id: '9',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '10',
    statusId: '10',
    status: {
      id: '10',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '10',
    clinician: {
      id: '10',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '11',
    statusId: '11',
    status: {
      id: '11',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '11',
    clinician: {
      id: '11',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '12',
    statusId: '12',
    status: {
      id: '12',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '12',
    clinician: {
      id: '12',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '13',
    statusId: '13',
    status: {
      id: '13',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '13',
    clinician: {
      id: '13',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '14',
    statusId: '14',
    status: {
      id: '14',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '14',
    clinician: {
      id: '14',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '15',
    statusId: '15',
    status: {
      id: '15',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '15',
    clinician: {
      id: '15',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '16',
    statusId: '16',
    status: {
      id: '16',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '16',
    clinician: {
      id: '16',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '17',
    statusId: '17',
    status: {
      id: '17',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '17',
    clinician: {
      id: '17',
      displayName: 'Tareq',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '18',
    statusId: '18',
    status: {
      id: '18',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '18',
    clinician: {
      id: '18',
      displayName: 'Aziz',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '19',
    statusId: '19',
    status: {
      id: '19',
      name: 'Critical',
      color: 'red',
    },
    clinicianId: '19',
    clinician: {
      id: '19',
      displayName: 'Torun',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '20',
    statusId: '20',
    status: {
      id: '20',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '20',
    clinician: {
      id: '20',
      displayName: 'Taslim',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
];

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

const dummyApi = {
  get: async (endpoint, { order, orderBy, page, rowsPerPage }) => {
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
storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed never', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      patient={{ id: '34234234' }}
      program={{
        id: '23242234234',
        date: '2023-08-28T02:40:16.237Z',
        removedOnce: false,
      }}
    />
  </ApiContext.Provider>
));

storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory removed once', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      patient={{ id: '34234234' }}
      program={{
        id: '23242234234',
        date: '2023-08-28T02:40:16.237Z',
        removedOnce: true,
      }}
    />
  </ApiContext.Provider>
));
