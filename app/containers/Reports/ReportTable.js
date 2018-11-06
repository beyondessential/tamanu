import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

import { SaveSpreadsheetButton } from '../../components/SaveSpreadsheetButton';

const dataColumns = [
  { 
    Header: 'Date',
    id: 'date', 
    accessor: row => row.date,
    sortMethod: (a, b) => a - b,
    Cell: record => moment(record.row.date).format('L'),
    exporter: row => moment(row.date).format('L'),
  },
  { 
    Header: 'Amount',
    accessor: 'amount',
  },
];

export const ReportTable = ({ data }) => (
  <div>
    <div style={ { textAlign: 'right' } }>
      <SaveSpreadsheetButton 
        filename="report"
        data={data}
        columns={dataColumns}
      />
    </div>
    <ReactTable
      data={ data }
      columns={dataColumns}
      minRows={ 1 }
    />
  </div>
);
