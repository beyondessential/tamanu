import React, { useState, useEffect, useCallback } from 'react';

import { ReportGeneratorForm } from '../../forms/ReportGeneratorForm';
import { Table } from '../../components/Table';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ReportGraph } from './ReportGraph';

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

export const VillageDiagnosesByWeekReport = ({ icd10Suggester, onRunQuery }) => (
  <Report
    FilterForm={props => <ReportGeneratorForm icd10Suggester={icd10Suggester} {...props} />}
    onRunQuery={onRunQuery}
  />
);
