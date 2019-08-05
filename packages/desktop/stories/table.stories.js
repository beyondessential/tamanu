import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Table } from '../app/components/Table/Table';

function TableStateWrapper({ columns, data }) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState(columns[0].key);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  function changeSort(columnKey) {
    const isDesc = orderBy === columnKey && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(columnKey);
  }

  const sortedData = data.sort(({ [orderBy]: a }, { [orderBy]: b }) => a.localeCompare(b));

  return (
    <Table
      columns={columns}
      data={sortedData}
      page={page}
      rowsPerPage={rowsPerPage}
      count={500}
      onChangePage={setPage}
      onChangeRowsPerPage={setRowsPerPage}
      onChangeSort={changeSort}
      onRowClick={action('row clicked')}
    />
  );
}

const dummyColumns = [{ key: 'name', Header: 'Fruit' }, { key: 'quantity', Header: 'Quantity' }];

const sortableColumns = [
  { key: 'name', Header: 'Fruit' },
  { key: 'quantity', Header: 'Quantity', sortable: true },
];

const dummyData = [
  { name: 'Apples', quantity: 53 },
  { name: 'Bananas', quantity: 14 },
  { name: 'Persimmon', quantity: 6 },
];

storiesOf('Table', module)
  .add('Plain', () => <Table columns={dummyColumns} data={dummyData} />)
  .add('With pagination', () => <TableStateWrapper columns={dummyColumns} data={dummyData} />)
  .add('In error state', () => (
    <Table columns={dummyColumns} errorMessage="Something has gone wrong with all this fruit!" />
  ))
  .add('In loading state', () => <Table columns={dummyColumns} isLoading />)
  .add('With no data', () => <Table columns={dummyColumns} data={[]} />)
  .add('With sorting', () => <TableStateWrapper columns={sortableColumns} data={dummyData} />);
