import React, { useEffect } from 'react';
import styled from 'styled-components';
import Chance from 'chance';

import { ApiContext } from '../app/api';
import { DataFetchingTable } from '../app/components/Table';
import { CheckInput } from '../app/components/Field';
import { DateDisplay } from '../app/components';

const chance = new Chance();

const Container = styled.div`
  position: relative;
  padding-top: 20px;
  margin-top: 75px;
`;

function fakePatient() {
  const gender = chance.pick(['male', 'female']);
  return {
    name: chance.name({ gender }),
    age: chance.age(),
    location: chance.address(),
    date: Date.now(),
  };
}

const dummyData = new Array(500).fill(0).map(fakePatient);

const dummyColumns = [
  { key: 'name', title: 'Patient' },
  { key: 'location', title: 'Location' },
  { key: 'age', title: 'Age' },
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
    dummyData.unshift(newPatient);
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
    }, chance.integer({ min: 1000, max: 1000 }));

    return () => {
      clearInterval(interval);
    };
  }, []);

  const dateColumn = {
    key: 'date',
    title: 'Date',
    accessor: ({ date }) => <DateDisplay date={date} timeOnlyTooltip />,
  };

  return (
    <ApiContext.Provider value={dummyApi}>
      <Container>
        <DataFetchingTable
          endpoint="ages"
          overrideLocalisationForStorybook={{ enabled: true, interval: 5 }}
          columns={dummyColumns.concat(dateColumn)}
          initialSort={{ order: 'desc', orderBy: 'date' }}
          autoRefresh
        />
      </Container>
    </ApiContext.Provider>
  );
};

export default {
  title: 'DataFetchingTable',
  component: DataFetchingTable,
};

export const Plain = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <DataFetchingTable endpoint="ages" columns={dummyColumns} />
    </ApiContext.Provider>
  ),
};

export const WithOptionRow = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <DataFetchingTable
        endpoint="ages"
        columns={dummyColumns}
        optionRow={<CheckInput label={<small>Dummy checkbox</small>} />}
      />
    </ApiContext.Provider>
  ),
};

export const WithPaginationError = {
  render: () => (
    <ApiContext.Provider value={paginationErrorApi}>
      <DataFetchingTable endpoint="ages" columns={dummyColumns} />
    </ApiContext.Provider>
  ),
};

export const WithAutorefreshEnabled = {
  render: () => <TableWithDynamicData />,
};

export const WithLazyLoading = {
  render: () => (
    <ApiContext.Provider value={dummyApi}>
      <DataFetchingTable lazyLoading endpoint="ages" columns={dummyColumns} />
    </ApiContext.Provider>
  ),
};
