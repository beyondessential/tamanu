import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import Chance from 'chance';

import { Table } from '../app/components/Table/Table';
import { CheckInput } from '../app/components/Field';

function TableStateWrapper({ columns, data }) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState(columns[0].key);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  function changeOrderBy(columnKey) {
    const isDesc = orderBy === columnKey && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(columnKey);
  }

  const sortedData = data.sort(({ [orderBy]: a }, { [orderBy]: b }) => {
    if (typeof a === 'string') {
      return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    return order === 'asc' ? a - b : b - a;
  });

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  return (
    <Table
      columns={columns}
      data={sortedData.slice(startIndex, endIndex)}
      page={page}
      rowsPerPage={rowsPerPage}
      count={data.length}
      orderBy={orderBy}
      order={order}
      onChangePage={setPage}
      onChangeRowsPerPage={setRowsPerPage}
      onChangeOrderBy={changeOrderBy}
      onRowClick={action('row clicked')}
      rowsPerPageOptions={[5, 10, 15]}
    />
  );
}

const dummyColumns = [
  { key: 'name', title: 'Fruit', sortable: false },
  { key: 'quantity', title: 'Quantity', sortable: false, numeric: true },
];

const sortableColumns = [
  { key: 'name', title: 'Fruit' },
  { key: 'quantity', title: 'Quantity', numeric: true },
];

const chance = new Chance();
const fakeFruit = () => ({
  name: chance.pick(['Apples', 'Bananas', 'Persimmon', 'Oranges', 'Melon']),
  quantity: chance.age(),
});

const dummyData = new Array(7).fill(0).map(fakeFruit);

storiesOf('Table', module)
  .add('Plain', () => <Table columns={dummyColumns} data={dummyData} />)
  .add('With pagination', () => <TableStateWrapper columns={dummyColumns} data={dummyData} />)
  .add('In error state', () => (
    <Table columns={dummyColumns} errorMessage="Something has gone wrong with all this fruit!" />
  ))
  .add('In loading state', () => <Table columns={dummyColumns} isLoading />)
  .add('With no data', () => <Table columns={dummyColumns} data={[]} />)
  .add('With option row', () => (
    <Table 
      columns={dummyColumns}
      data={dummyData}
      optionRow={<CheckInput label={<small>Include citrus fruits</small>} />} 
    />
  ))
  .add('With sorting', () => <TableStateWrapper columns={sortableColumns} data={dummyData} />);