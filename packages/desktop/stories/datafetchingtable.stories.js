import React, { useEffect } from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import Chance from 'chance';

import { ApiContext } from '../app/api';
import { DataFetchingTable } from '../app/components/Table';
import { CheckInput } from '../app/components/Field';

const chance = new Chance();

const Container = styled.div`
  position: relative;
`;

function fakePatient() {
  const gender = chance.pick(['male', 'female']);
  return {
    name: chance.name({ gender }),
    age: chance.age(),
    location: chance.address(),
    date: chance.date({ string: true, american: false }),
  };
}

const dummyData = new Array(500).fill(0).map(fakePatient);

const dummyColumns = [
  { key: 'name', title: 'Patient' },
  { key: 'location', title: 'Location' },
  { key: 'age', title: 'Age' },
  { key: 'date', title: 'Date' },
];

const dummyApi = {
  get: async (endpoint, { order, orderBy, page, rowsPerPage }) => {
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
  addPatient: newPatient => {
    dummyData.unshift(newPatient); // Add the new patient at the beginning of the array
  },
};

const paginationErrorApi = {
  get: async (endpoint, query) => {
    if (query.page) throw new Error('Hardcoded pagination error.');
    return dummyApi.get(endpoint, query);
  },
};

const TableWithDynamicData = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const newPatient = fakePatient();
      dummyApi.addPatient(newPatient);
    }, chance.integer({ min: 5000, max: 15000 })); // Random interval between 5 to 15 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <ApiContext.Provider value={dummyApi}>
      <Container>
        <DataFetchingTable
          endpoint="ages"
          columns={dummyColumns}
          initialSort={{ order: 'desc', orderBy: 'date' }}
          autoRefresh
        />
      </Container>
    </ApiContext.Provider>
  );
}

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
  .add('With autorefresh enabled', () => TableWithDynamicData());
