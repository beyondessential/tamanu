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

    const { ageMin, ageMax, range } = filters;
    const checkEqualFilter = (row, key) => !filters[key] || (filters[key] === row[key]);
    const filteredValues = data
      .filter(row => {
        if(!checkEqualFilter(row, 'diagnosis')) return false;
        if(!checkEqualFilter(row, 'location')) return false;
        if(!checkEqualFilter(row, 'sex')) return false;
        if(!checkEqualFilter(row, 'prescriber')) return false;
        if(ageMin && ageMin > row.age) return false;
        if(ageMax && ageMax < row.age) return false;
        if(range) {
          if(range.start.isAfter(row.date)) return false;
          if(range.end.isBefore(row.date)) return false;
        }
        return true;
      });
    
    console.log(filters, filteredValues.length);
    const valuesByKey = filteredValues.reduce(patientsPerDay.reducer, {});
    
    // ensure a continuous date range by filling out missing counts with 0
    const dateAxis = true;
    if(range && dateAxis) {
      let dateIterator = moment(range.start).startOf('day');
      console.log(valuesByKey);
      while(dateIterator.isBefore(range.end)) {
        const dateKey = dateIterator.toDate();
        valuesByKey[dateKey] = valuesByKey[dateKey] || 0;
        dateIterator.add(1, 'day');
      }
    }

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
