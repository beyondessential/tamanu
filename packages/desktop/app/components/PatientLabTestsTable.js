import React from 'react';

import { usePatientLabTestResults } from '../api/queries/usePatientLabTestResults';
import { Table } from './Table';

export const PatientLabTestsTable = React.memo(({ patient }) => {
  const { data, isLoading } = usePatientLabTestResults(patient.id);
  const allDates = isLoading
    ? []
    : Object.keys(Object.assign({}, ...data?.data.map(x => x.results)));
  const columns = [
    { key: 'testCategory', title: 'Test category' },
    { key: 'testType', title: 'Test type' },
    {
      key: 'normalRange',
      title: 'Normal range',
      accessor: cells => {
        const range = cells.normalRanges[patient?.sex];
        if (!range.min) {
          return '-';
        }
        return `${range.min}-${range.max}`;
      },
    },
    ...allDates
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: date,
        sortable: false,
        key: date,
        accessor: cells => {
          return cells.results[date];
        },
      })),
  ];

  return (
    <Table
      columns={columns}
      data={data?.data}
      isLoading={isLoading}
      noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
      // TODO Open modal on click WAITM-666
      // onRowClick={onSelectLabTest}
      allowExport={false}
    />
  );
});
