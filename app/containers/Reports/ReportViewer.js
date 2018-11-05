import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

import { 
  LineChart,
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { patientsPerDay } from './dummyReports';

const graphStyle = {
  padding: '0 3em',
  margin: 'auto',
  height: '20em',
  display: 'block',
};

const ReportGraph = ({ data }) => (
  <div style={ graphStyle }>
    <ResponsiveContainer>
      <LineChart data={data}>
        <XAxis dataKey="formatted"/>
        <YAxis/>
        <Tooltip />
        <CartesianGrid stroke="#eee" />
        <Line 
          type="monotone" 
          isAnimationActive={ false } 
          dataKey="amount" 
          stroke="#000" 
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

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
      .map(k => ({ 
        date: moment(k).valueOf(), 
        formatted: moment(k).format('L'),
        amount: totals[k]
      }))
      .sort((a, b) => a.date - b.date);

    console.log(dataRows);

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
        <ReportGraph data={ this.state.totals } />
        <hr />
        <ReportData data={ this.state.totals } />
      </div>
    );
  }
}
