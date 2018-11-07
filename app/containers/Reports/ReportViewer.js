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
    const { data, filters } = this.props;

    const { diagnosis, location, ageMin, ageMax, sex } = filters;
    const valuesByKey = data
      .filter(row => {
        if(diagnosis && diagnosis !== row.diagnosis) return false;
        if(location && location !== row.location) return false;
        if(sex && sex !== row.sex) return false;
        if(prescriber !== row.prescriber) return false;
        if(ageMin && ageMin > row.age) return false;
        if(ageMax && ageMax < row.age) return false;
        return true;
      })
      .reduce(patientsPerDay.reducer, {});
    
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

  componentDidUpdate(prevProps) {
    if(JSON.stringify(prevProps.filters) !== JSON.stringify(this.props.filters)) {
      this.recalculate();
    }
  }

  render() {
    return (
      <div>
        <ReportGraph data={ this.state.values } />
        <hr />
        <ReportTable data={ this.state.values } />
      </div>
    );
  }
}
