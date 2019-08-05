import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Table } from '../app/components/Table/Table';

class TableStateWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 10,
      numberOfRecords: 500,
      errorMessage: null,
    };
  }

  changePage = page => {
    this.setState({ page });
  };

  changeRowsPerPage = rowsPerPage => {
    this.setState({ rowsPerPage });
  };

  render() {
    const { columns, data } = this.props;
    const { errorMessage, page, rowsPerPage, numberOfRecords } = this.state;
    return (
      <Table
        columns={columns}
        data={data}
        errorMessage={errorMessage}
        page={page}
        rowsPerPage={rowsPerPage}
        count={numberOfRecords}
        onChangePage={this.changePage}
        onChangeRowsPerPage={this.changeRowsPerPage}
        onRowClick={action('row clicked')}
      />
    );
  }
}

const dummyColumns = { name: 'Fruit', quantity: 'Quantity' };

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
  .add('With no data', () => <Table columns={dummyColumns} data={[]} />);
