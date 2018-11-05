import React, { Component } from 'react';
import moment from 'moment';

import { patientsPerDay } from './dummyReports';

import { ReportTable } from './ReportTable';
import { ReportGraph } from './ReportGraph';

export class ReportViewer extends Component {
  
  state = {
    values: [],
  };

  recalculate() {
    const { data } = this.props;
    const valuesByKey = data.reduce(patientsPerDay.reducer, {});
    
    const values = Object.keys(valuesByKey)
      .map(k => ({ 
        date: moment(k).valueOf(), 
        formatted: moment(k).format('L'),
        amount: valuesByKey[k]
      }))
      .sort((a, b) => a.date - b.date);

    this.setState({ values });
  }

  componentDidMount() {
    this.recalculate();
  }

  render() {
    const { data } = this.props;
    return (
      <div>
        <ReportGraph data={ this.state.values } />
        <hr />
        <ReportTable data={ this.state.values } />
      </div>
    );
  }
}
