import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { usePatientLabTestResults } from '../api/queries/usePatientLabTestResults';
import { Table } from './Table';
import { Colors } from '../constants';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const StyledCellWrapper = styled.div`
  position: sticky;
  z-index: 1;
  border-right: 1px solid ${Colors.outline};
`;

const CategoryCell = styled(StyledCellWrapper)`
  left: 0;
`;
const TestTypeCell = styled(StyledCellWrapper)`
  left: 30;
`;
const NormalRangeCell = styled(StyledCellWrapper)`
  left: 60;
`;

export const PatientLabTestsTable = React.memo(({ patient }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const { data, isLoading } = usePatientLabTestResults(patient.id, { page, rowsPerPage });

  const allDates = isLoading
    ? []
    : Object.keys(Object.assign({}, ...data?.data.map(x => x.results)));
  const columns = [
    {
      key: 'testCategory',
      title: 'Test category',
      accessor: row => <CategoryCell>{row.testCategory}</CategoryCell>,
    },
    {
      key: 'testType',
      title: 'Test type',
      accessor: row => <TestTypeCell>{row.testType}</TestTypeCell>,
    },
    {
      key: 'normalRange',
      title: 'Normal range',
      accessor: row => {
        const range = row.normalRanges[patient?.sex];
        const value = !range.min ? '-' : `${range.min}-${range.max}`;
        return <NormalRangeCell>{value}</NormalRangeCell>;
      },
    },
    ...allDates
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: date,
        sortable: false,
        key: date,
        accessor: row => {
          return row.results[date] || null;
        },
      })),
  ];

  return (
    <Table
      columns={columns}
      data={data?.data}
      isLoading={isLoading}
      noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
      page={page}
      rowsPerPage={rowsPerPage}
      onChangeRowsPerPage={setRowsPerPage}
      onChangePage={setPage}
      count={data?.count}
      // TODO Open modal on click WAITM-666
      // onRowClick={onSelectLabTest}
      allowExport={false}
    />
  );
});
