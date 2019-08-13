import React, { Component } from 'react';
import moment from 'moment';
import deepEqual from 'deep-equal';

import { ReportTable } from './ReportTable';
import { ReportGraph } from './ReportGraph';

import { visualisationOptions } from './dummyReports';

const aggregationGranularity = 10;

const getVisualisation = ({ visualisation, dataset }) => {
  const params = { ...visualisationOptions.find(vo => vo.value === visualisation) };
  if (!params.dataType) return undefined;

  if (params.dataType === 'datetime') {
    params.rowKey = 'date';
  } else {
    switch (dataset) {
      case 'diagnoses':
        params.dataType = params.dataType === 'aggregated' ? 'numeric' : params.dataType;
        params.rowKey = 'diagnosis';
        break;
      case 'visits':
        params.dataType = 'datetime';
        params.rowKey = 'date';
        break;
      case 'medications':
        params.dataType = params.dataType === 'aggregated' ? 'numeric' : params.dataType;
        params.rowKey = 'medication';
        break;
      case 'procedures':
        params.dataType = params.dataType === 'aggregated' ? 'numeric' : params.dataType;
        params.rowKey = 'procedure';
        break;
      default:
    }
  }

  switch (params.dataType) {
    case 'aggregated':
      params.getCountKey = row => {
        const lowBound =
          Math.floor(row[params.rowKey] / aggregationGranularity) * aggregationGranularity;
        return `${lowBound}-${lowBound + aggregationGranularity}`;
      };
      break;
    case 'datetime':
      params.getCountKey = row =>
        moment(row[params.rowKey])
          .startOf('day')
          .toDate();
      break;
    default:
      params.getCountKey = row => row[params.rowKey];
  }

  return params;
};

export class ReportViewer extends Component {
  state = {
    values: [],
  };

  componentDidMount() {
    this.recalculate();
  }

  componentDidUpdate(prevProps) {
    if (!deepEqual(prevProps.filters, this.props.filters)) this.recalculate();
  }

  recalculate() {
    const { data, filters, report } = this.props;

    const { ageMin, ageMax, range } = filters;
    const checkEqualFilter = (row, key) => !filters[key] || filters[key] === row[key];
    const filteredValues = data.filter(row => {
      if (!checkEqualFilter(row, 'diagnosis')) return false;
      if (!checkEqualFilter(row, 'location')) return false;
      if (!checkEqualFilter(row, 'sex')) return false;
      if (!checkEqualFilter(row, 'prescriber')) return false;
      if (ageMin && ageMin > row.age) return false;
      if (ageMax && ageMax < row.age) return false;
      if (range) {
        if (range.start.isAfter(row.date)) return false;
        if (range.end.isBefore(row.date)) return false;
      }
      return true;
    });

    const valuesByKey = filteredValues.reduce((totals, row) => {
      const key = report.getCountKey(row);
      return {
        ...totals,
        [key]: (totals[key] || 0) + 1,
      };
    }, {});

    // ensure a continuous date range by filling out missing counts with 0
    const isReportDateBased = report.graphType === 'line';

    if (range && isReportDateBased) {
      const dateIterator = moment(range.start).startOf('day');

      while (dateIterator.isBefore(range.end)) {
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

    const format = isReportDateBased ? formatDateRange : formatValueRange;
    const values = Object.keys(valuesByKey)
      .map(format)
      .sort((a, b) => a.sort - b.sort);

    this.setState({ values });
  }

  render() {
    const { filters, report } = this.props;
    const { id: reportId } = report;
    const hide = { graph: false, table: false };

    if (reportId === 'custom-report') {
      hide.graph = true;
      hide.table = true;
      const reportView = getVisualisation(filters);

      if (reportView) {
        const { graphType, getCountKey } = reportView;
        report.graphType = graphType;
        report.getCountKey = getCountKey;
        hide.graph = graphType === 'table';
        hide.table = !hide.graph;
      }
    }

    return (
      <div>
        <ReportGraph report={report} data={this.state.values} hidden={hide.graph} />
        {!hide.graph && !hide.table && <hr />}
        <ReportTable data={this.state.values} hidden={hide.table} />
      </div>
    );
  }
}
