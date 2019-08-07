import React from 'react';
import { storiesOf } from '@storybook/react';

import { ApiContext } from '../app/api';
import { DataFetchingTable } from '../app/components/Table';

class DummyApi {
  todo = () => console.log('You are using the dummy api');
}

const dummyColumns = [
  { key: 'name', title: 'Fruit' },
  { key: 'quantity', title: 'Quantity', numeric: true },
];

const dummyData = [
  { name: 'Apples', quantity: 53 },
  { name: 'Bananas', quantity: 14 },
  { name: 'Persimmon', quantity: 6 },
];

storiesOf('DataFetchingTable', module).add('Plain', () => (
  <ApiContext.Provider value={new DummyApi()}>
    <DataFetchingTable columns={dummyColumns} data={dummyData} />
  </ApiContext.Provider>
));
