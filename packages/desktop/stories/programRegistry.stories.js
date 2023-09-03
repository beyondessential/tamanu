import React from 'react';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryStatusHistory } from '../app/views/programRegistry/ProgramRegistryStatusHistory';

import { ApiContext } from '../app/api';
const dummyData = [
  { id: '1', status: 'Low risk', recordedBy: 'Tareq', date: '2023-08-28T02:40:16.237Z' },
  { id: '2', status: 'Needs review', recordedBy: 'Aziz', date: '2023-08-28T02:40:16.237Z' },
  { id: '3', status: 'Critical', recordedBy: 'Torun', date: '2023-08-28T02:40:16.237Z' },
  { id: '4', status: 'Needs review', recordedBy: 'Taslim', date: '2023-08-28T02:40:16.237Z' },
  { id: '5', status: 'Low risk', recordedBy: 'Tareq', date: '2023-08-28T02:40:16.237Z' },
  { id: '6', status: 'Needs review', recordedBy: 'Aziz', date: '2023-08-28T02:40:16.237Z' },
  { id: '7', status: 'Critical', recordedBy: 'Torun', date: '2023-08-28T02:40:16.237Z' },
  { id: '8', status: 'Needs review', recordedBy: 'Taslim', date: '2023-08-28T02:40:16.237Z' },
  { id: '9', status: 'Low risk', recordedBy: 'Tareq', date: '2023-08-28T02:40:16.237Z' },
  { id: '10', status: 'Needs review', recordedBy: 'Aziz', date: '2023-08-28T02:40:16.237Z' },
  { id: '11', status: 'Critical', recordedBy: 'Torun', date: '2023-08-28T02:40:16.237Z' },
  { id: '12', status: 'Needs review', recordedBy: 'Taslim', date: '2023-08-28T02:40:16.237Z' },
  { id: '13', status: 'Low risk', recordedBy: 'Tareq', date: '2023-08-28T02:40:16.237Z' },
  { id: '14', status: 'Needs review', recordedBy: 'Aziz', date: '2023-08-28T02:40:16.237Z' },
  { id: '15', status: 'Critical', recordedBy: 'Torun', date: '2023-08-28T02:40:16.237Z' },
  { id: '16', status: 'Needs review', recordedBy: 'Taslim', date: '2023-08-28T02:40:16.237Z' },
  { id: '17', status: 'Low risk', recordedBy: 'Tareq', date: '2023-08-28T02:40:16.237Z' },
  { id: '18', status: 'Needs review', recordedBy: 'Aziz', date: '2023-08-28T02:40:16.237Z' },
  { id: '19', status: 'Critical', recordedBy: 'Torun', date: '2023-08-28T02:40:16.237Z' },
  { id: '20', status: 'Needs review', recordedBy: 'Taslim', date: '2023-08-28T02:40:16.237Z' },
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
storiesOf('Program Registry', module).add('ProgramRegistryStatusHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryStatusHistory
      program={{
        id: '23242234234',
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: 'Low risk',
      }}
    />
  </ApiContext.Provider>
));
