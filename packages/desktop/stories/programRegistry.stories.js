import React from 'react';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';

import { ApiContext } from '../app/api';
const dummyData = [
  {
    id: '1',
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '1',
    programRegistryClinicalStatus: {
      id: '1',
      name: 'Low risk',
      color: 'green',
    },
    clinicianId: '1',
    clinician: {
      id: '1',
      displayName: 'Tareq The First',
    },
    date: '2023-08-28T02:40:16.237Z',
    registrationDate: '2023-08-28T02:40:16.237Z',
  },
  {
    id: '2',
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '2',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '3',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '4',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '5',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '6',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '7',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '8',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '9',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '10',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '11',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '12',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '13',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '14',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '15',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '16',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '17',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '18',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'active',
    programRegistryClinicalStatusId: '19',
    programRegistryClinicalStatus: {
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
    registrationStatus: 'removed',
    programRegistryClinicalStatusId: '20',
    programRegistryClinicalStatus: {
      id: '20',
      name: 'Needs review',
      color: 'yellow',
    },
    clinicianId: '20',
    clinician: {
      id: '20',
      displayName: 'Taslim the last',
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
  get: async (endpoint, options) => {
    console.log(options.order, options.orderBy);
    const sortedData =
      options.order && options.orderBy
        ? dummyData.sort(({ [options.orderBy]: a }, { [options.orderBy]: b }) => {
            if (typeof a === 'string') {
              return options.order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
            }
            return options.order === 'asc' ? a - b : b - a;
          })
        : sortedData;
    const startIndex = options.page * options.rowsPerPage || 0;
    const endIndex = startIndex + options.rowsPerPage ? options.rowsPerPage : sortedData.length;

    console.log(endpoint, sortedData);
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
      }}
    />
  </ApiContext.Provider>
));
