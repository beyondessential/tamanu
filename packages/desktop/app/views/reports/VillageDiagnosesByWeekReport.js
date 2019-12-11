import React, { useState, useEffect, useCallback } from 'react';

import { ReportGeneratorForm } from '../../forms/ReportGeneratorForm';
import { Table } from '../../components/Table';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ReportGraph } from './ReportGraph';

import moment from 'moment';

const Results = React.memo(({ data }) => {
  if(!data) return <LoadingIndicator loading />;

  const { results, meta } = data;
  const dataColumns = meta.columns.map((d, i) => ({
    title: d,
    key: `values[${i}]`,
    accessor: row => row.values[i] || '',
  }));

  const columns = [ { key: 'formatted', title: meta.title }, ...dataColumns, ];

  return (
    <div>
      <Table data={results} columns={columns} />
    </div>
  );
});

const Report = React.memo(({ onRunQuery, FilterForm  }) => {
  const [filters, setFilters] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFilterSubmit = useCallback(data => setFilters(data));

  const updateData = useEffect(() => {
    let canceled = false;
    (async () => {
      setData(null);
      if(filters) {
        setLoading(true);
        const result = await onRunQuery(filters);
        if(canceled) return;
        setLoading(false);
        setData(result);
      }
    })();

    return () => { canceled = true };
  }, [filters]);

  return (
    <div>
      <FilterForm onSubmit={onFilterSubmit} />
      { filters && <Results data={data} /> }
    </div>
  );
});

async function onRunQuery(filters) {
  // TODO: api request
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { diagnoses, startDate, endDate } = filters;
  const start = moment(startDate);
  const end = moment(endDate);
  const ranges = [ ];

  let date = moment(start);
  while(date < end) {
    ranges.push(date);
    date = moment(date).add(1, 'week');
  }

  const columns = ranges.map(x => x.format('DD/MM/YYYY'));

  const results = diagnoses.map(({ _id }) => ({
    key: _id,
    formatted: "~~!!~~ " + _id,
    values: columns.map(c => Math.floor(Math.random() * 10)),
  }));

  const meta = {
    title: "Diagnosis",
    columns,
  };

  return { results, meta };
}

export const VillageDiagnosesByWeekReport = ({ icd10Suggester }) => (
  <Report
    FilterForm={props => <ReportGeneratorForm icd10Suggester={icd10Suggester} {...props} />}
    onRunQuery={onRunQuery}
  />
);
