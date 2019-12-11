import React, { useState, useEffect, useCallback } from 'react';

import { ReportGeneratorForm } from '../../forms/ReportGeneratorForm';
import { Table } from '../../components/Table';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ReportGraph } from './ReportGraph';

const Results = ({ columns, data }) => {
  if(!data) return <LoadingIndicator loading />;
  return (
    <div>
      <Table data={data} columns={columns} />
    </div>
  );
};

const Report = React.memo(({ runQuery, FilterForm  }) => {
  const [filters, setFilters] = useState(null);
  const [data, setData] = useState(null);

  const onFilterSubmit = useCallback(data => setFilters(data));

  const updateData = useEffect(() => {
    let canceled = false;
    (async () => {
      setData(null);
      if(filters) {
        const result = await runQuery(filters);
        if(canceled) return;
        setData(result);
      }
    })();

    return () => { canceled = true };
  }, [filters]);

  const title = "Diagnoses";
  const dataColumns = (data && data.length > 0)
    ? data[0].values.map((d, i) => ({
      title: `${i}`,
      key: `values[${i}]`,
      accessor: row => row.values[i] || '',
    }))
    : [];

  const columns = [ { key: 'formatted', title }, ...dataColumns, ];

  return (
    <div>
      <FilterForm onSubmit={onFilterSubmit} />
      { filters && <Results data={data} columns={columns} /> }
    </div>
  );
});

async function runQuery(filters) {
  // TODO: api request
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { diagnoses, startDate, endDate } = filters;
  return diagnoses.map(({ _id }) => ({
    key: _id,
    formatted: "K" + _id,
    values: [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ]
  }));
}

export const VillageDiagnosesByWeekReport = ({ icd10Suggester }) => (
  <Report
    FilterForm={props => <ReportGeneratorForm icd10Suggester={icd10Suggester} {...props} />}
    runQuery={runQuery}
  />
);
