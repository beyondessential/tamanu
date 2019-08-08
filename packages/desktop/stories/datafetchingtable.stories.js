import React from 'react';
import { storiesOf } from '@storybook/react';

import { ApiContext } from '../app/api';
import { DataFetchingTable } from '../app/components/Table';

const dummyColumns = [
  { key: 'name', title: 'Fruit' },
  { key: 'quantity', title: 'Quantity', numeric: true },
];

const dummyData = [
  { name: 'Apples', quantity: 53 },
  { name: 'Bananas', quantity: 14 },
  { name: 'Persimmon', quantity: 6 },
];

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

class DummyApi {
  get = async (endpoint, { sorting }) => {
    await sleep(1000);
    const { orderBy, order } = sorting;
    const sortedData = dummyData.sort(({ [orderBy]: a }, { [orderBy]: b }) => {
      if (typeof a === 'string') {
        return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      }
      return order === 'asc' ? a - b : b - a;
    });
    return {
      data: sortedData,
      count: 500,
    };
  };
}

storiesOf('DataFetchingTable', module).add('Plain', () => (
  <ApiContext.Provider value={new DummyApi()}>
    <DataFetchingTable endpoint="fruit" columns={dummyColumns} />
  </ApiContext.Provider>
));
