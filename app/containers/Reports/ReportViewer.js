import React, { Component } from 'react';
import moment from 'moment';

import { patientsPerDay } from './dummyReports';

import { ReportTable } from './ReportTable';
import { ReportGraph } from './ReportGraph';

export class ReportViewer extends Component {
  
  state = {
    totals: [],
  };

  recalculate() {
    const { data } = this.props;
    const totalsByKey = data.reduce(patientsPerDay.reducer, {});
    
    const totals = Object.keys(totalsByKey)
      .map(k => ({ 
        date: moment(k).valueOf(), 
        formatted: moment(k).format('L'),
        amount: totalsByKey[k]
      }))
      .sort((a, b) => a.date - b.date);

    this.setState({ totals });
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
        <ReportTable data={ this.state.totals } />
      </div>
    );
  }
}
