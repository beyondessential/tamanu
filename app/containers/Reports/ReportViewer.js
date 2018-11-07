import React, { Component } from 'react';
import moment from 'moment';

import { ReportTable } from './ReportTable';
import { ReportGraph } from './ReportGraph';

export class ReportViewer extends Component {
  
  state = {
    values: [],
  };

  recalculate() {
    const { data, filters, report } = this.props;

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
    
    const valuesByKey = filteredValues.reduce(report.reducer, {});
    
    // ensure a continuous date range by filling out missing counts with 0
    const isReportDateBased = (report.graphType === 'line');

    if(range && isReportDateBased) {
      let dateIterator = moment(range.start).startOf('day');
      console.log(valuesByKey);
      while(dateIterator.isBefore(range.end)) {
        const dateKey = dateIterator.toDate();
        valuesByKey[dateKey] = valuesByKey[dateKey] || 0;
        dateIterator.add(1, 'day');
      }
    }

    const formatDateRange = key => ({
      sort: moment(key).valueOf(), 
      formatted: moment(key).format('L'),
      amount: valuesByKey[key],
    });
    const formatValueRange = key => ({
      sort: key,
      formatted: key,
      amount: valuesByKey[key],
    });

    const format = (isReportDateBased) ? formatDateRange : formatValueRange;
    const values = Object.keys(valuesByKey)
      .map(format)
      .sort((a, b) => a.sort - b.sort);

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
    const { report } = this.props;

    return (
      <div>
        <ReportGraph report={ report} data={ this.state.values } />
        <hr />
        <ReportTable data={ this.state.values } />
      </div>
    );
  }
}
