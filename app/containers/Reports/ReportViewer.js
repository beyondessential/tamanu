import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

import { patientsPerDay } from './dummyReports';

const graphStyle = {
  margin: '1em',
  background: '#777',
  color: '#ddd',
  padding: '15em 0em',
  textAlign: 'center',
  border: '1px solid #555',
};

const ReportGraph = ({ data }) => (
  <div style={ graphStyle }>Graph goes here</div>
);

const dataColumns = [
  { 
    Header: 'Date',
    id: 'date', 
    accessor: record => record.date,
    sortMethod: (a, b) => a - b,
    Cell: record => record.row.date.format("L"),
  },
  { 
    Header: 'Amount',
    accessor: 'amount',
  },
];

const ReportData = ({ data }) => (
  <ReactTable
    data={ data }
    columns={dataColumns}
    minRows={ 1 }
  />
);

export class ReportViewer extends Component {
  
  state = {
    totals: [],
  };

  recalculate() {
    const { data } = this.props;
    const totals = data.reduce(patientsPerDay.reducer, {});
    
    const dataRows = Object.keys(totals)
      .map(k => ({ date: moment(k), amount: totals[k] }))

    this.setState({ 
      totals: dataRows,
    });
  }

  componentDidMount() {
    this.recalculate();
  }

  render() {
    const { data } = this.props;
    return (
      <div>
        <ReportGraph data={ data } />
        <hr />
        <ReportData data={ this.state.totals } />
      </div>
    );
  }
}
