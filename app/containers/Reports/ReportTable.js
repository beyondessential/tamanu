import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

const dataColumns = [
  { 
    Header: 'Date',
    id: 'date', 
    accessor: record => record.date,
    sortMethod: (a, b) => a - b,
    Cell: record => moment(record.row.date).format('L'),
  },
  { 
    Header: 'Amount',
    accessor: 'amount',
  },
];

export const ReportTable = ({ data }) => (
  <ReactTable
    data={ data }
    columns={dataColumns}
    minRows={ 1 }
  />
);
