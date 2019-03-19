import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

import { SaveSpreadsheetButton } from '../../components/SaveSpreadsheetButton';

const dataColumns = [
  {
    Header: 'Date',
    id: 'key',
    accessor: row => row.sort,
    sortMethod: (a, b) => a - b,
    Cell: record => record.original.formatted,
    exporter: row => row.formatted,
  },
  {
    Header: 'Amount',
    accessor: 'amount',
  },
];

const buttonContainerStyle = {
  marginBottom: '0.5rem',
  textAlign: 'right',
};

export const ReportTable = ({ data }) => (
  <div>
    <div style={buttonContainerStyle}>
      <SaveSpreadsheetButton
        filename="report"
        data={data}
        columns={dataColumns}
      />
    </div>
    <ReactTable
      data={data}
      columns={dataColumns}
      minRows={1}
    />
  </div>
);
