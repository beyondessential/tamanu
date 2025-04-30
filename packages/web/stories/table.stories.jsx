import React from 'react';
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

export default {
  title: 'Table',
  component: Table,
};

const Template = args => <Table {...args} />;

export const Plain = Template.bind({});
Plain.args = {
  columns: dummyColumns,
  data: dummyData,
};

export const WithPagination = {
  render: () => <TableStateWrapper columns={dummyColumns} data={dummyData} />,
};

export const InErrorState = Template.bind({});
InErrorState.args = {
  columns: dummyColumns,
  errorMessage: 'Something has gone wrong with all this fruit!',
};

export const InLoadingState = Template.bind({});
InLoadingState.args = {
  columns: dummyColumns,
  isLoading: true,
  data: [],
};

export const WithNoData = Template.bind({});
WithNoData.args = {
  columns: dummyColumns,
  data: [],
};

export const WithOptionRow = Template.bind({});
WithOptionRow.args = {
  columns: dummyColumns,
  data: dummyData,
  optionRow: <CheckInput label={<small>Include citrus fruits</small>} />,
};

export const WithSorting = {
  render: () => <TableStateWrapper columns={sortableColumns} data={dummyData} />,
};
