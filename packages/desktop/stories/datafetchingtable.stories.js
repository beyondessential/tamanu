import React from 'react';
import { storiesOf } from '@storybook/react';
import Chance from 'chance';

import { ApiContext } from '../app/api';
import { DataFetchingTable } from '../app/components/Table';
import { CheckInput } from '../app/components/Field';

const chance = new Chance();

function fakePatient() {
  const gender = chance.pick(['male', 'female']);
  return {
    name: chance.name({ gender }),
    age: chance.age(),
    location: chance.address(),
  };
}

const dummyData = new Array(500).fill(0).map(fakePatient);

const dummyColumns = [
  { key: 'name', title: 'Patient' },
  { key: 'location', title: 'Location' },
  { key: 'age', title: 'Age' },
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

const paginationErrorApi = {
  get: async (endpoint, query) => {
    if (query.page) throw new Error('Hardcoded pagination error.');
    return dummyApi.get(endpoint, query);
  },
};

storiesOf('DataFetchingTable', module)
  .add('Plain', () => (
    <ApiContext.Provider value={dummyApi}>
      <DataFetchingTable endpoint="ages" columns={dummyColumns} />
    </ApiContext.Provider>
  ))
  .add('With optionRow', () => (
    <ApiContext.Provider value={dummyApi}>
      <DataFetchingTable 
        endpoint="ages" 
        columns={dummyColumns}
        optionRow={<CheckInput label={<small>Dummy checkbox</small>} />} 
      />
    </ApiContext.Provider>
  ))
  .add('With pagination error', () => (
    <ApiContext.Provider value={paginationErrorApi}>
      <DataFetchingTable endpoint="ages" columns={dummyColumns} />
    </ApiContext.Provider>
  ))
  .add('With autorefresh', () => (
    <ApiContext.Provider value={paginationErrorApi}>
      <DataFetchingTable endpoint="ages" columns={dummyColumns} autorefresh />
    </ApiContext.Provider>
  ));
