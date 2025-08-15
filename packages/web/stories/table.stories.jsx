import React from 'react';

import { action } from 'storybook/actions';
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

export default {
  title: 'Table',
};

export const Plain = () => <Table columns={dummyColumns} data={dummyData} />;
export const WithPagination = () => <TableStateWrapper columns={dummyColumns} data={dummyData} />;

WithPagination.story = {
  name: 'With pagination',
};

export const InErrorState = () => (
  <Table columns={dummyColumns} errorMessage="Something has gone wrong with all this fruit!" />
);

InErrorState.story = {
  name: 'In error state',
};

export const InLoadingState = () => <Table columns={dummyColumns} isLoading data={[]} />;

InLoadingState.story = {
  name: 'In loading state',
};

export const WithNoData = () => <Table columns={dummyColumns} data={[]} />;

WithNoData.story = {
  name: 'With no data',
};

export const WithOptionRow = () => (
  <Table
    columns={dummyColumns}
    data={dummyData}
    optionRow={<CheckInput label={<small>Include citrus fruits</small>} />}
  />
);

WithOptionRow.story = {
  name: 'With option row',
};

export const WithSorting = () => <TableStateWrapper columns={sortableColumns} data={dummyData} />;

WithSorting.story = {
  name: 'With sorting',
};
