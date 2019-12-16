import React, { useState, useEffect, useCallback } from 'react';

import { Table } from '../../components/Table';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ReportGraph } from './ReportGraph';

const Results = React.memo(({ data }) => {
  if (!data) return <LoadingIndicator loading />;

  const { results, meta } = data;
  const dataColumns = meta.columns.map((d, i) => ({
    title: d,
    key: `values[${i}]`,
    accessor: row => row.values[i] || '',
  }));

  const columns = [{ key: 'formatted', title: meta.title }, ...dataColumns];

  return (
    <div>
      <Table data={results} columns={columns} />
    </div>
  );
});

export const BaseReport = React.memo(({ onRunQuery, FilterForm }) => {
  const [filters, setFilters] = useState(null);
  const [data, setData] = useState(null);

  const onFilterSubmit = useCallback(f => setFilters(f));

  useEffect(() => {
    let canceled = false;
    (async () => {
      setData(null);
      if (filters) {
        const result = await onRunQuery(filters);
        if (canceled) return;
        setData(result);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [filters]);

  return (
    <div>
      <FilterForm onSubmit={onFilterSubmit} />
      {filters && <Results data={data} />}
    </div>
  );
});
