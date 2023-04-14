import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { usePatientLabTestResults } from '../../api/queries/usePatientLabTestResults';
import { Table } from '../../components/Table';
import { RangeValidatedCell, DateHeadCell } from '../../components/FormattedTableCell';
import { Colors } from '../../constants';
import { LabTestResultModal } from './LabTestResultModal';

const COLUMNS = {
  1: 150,
  2: 120,
  3: 120,
};

const StyledTable = styled(Table)`
  table {
    position: relative;

    thead tr th:nth-child(1),
    tbody tr td:nth-child(1),
    thead tr th:nth-child(2),
    tbody tr td:nth-child(2),
    thead tr th:nth-child(3),
    tbody tr td:nth-child(3) {
      position: sticky;
      z-index: 1;
      border-right: 1px solid ${Colors.outline};
    }

    thead tr th:nth-child(1),
    tbody tr td:nth-child(1) {
      left: 0;
      width: ${COLUMNS[1]}px;
      min-width: ${COLUMNS[1]}px;
      max-width: ${COLUMNS[1]}px;
    }

    thead tr th:nth-child(2),
    tbody tr td:nth-child(2) {
      width: ${COLUMNS[2]}px;
      min-width: ${COLUMNS[2]}px;
      max-width: ${COLUMNS[2]}px;
      left: ${COLUMNS[1]}px;
    }

    thead tr th:nth-child(3),
    tbody tr td:nth-child(3) {
      width: ${COLUMNS[3]}px;
      min-width: ${COLUMNS[3]}px;
      max-width: ${COLUMNS[3]}px;
      left: ${COLUMNS[1] + COLUMNS[2]}px;
      border-right: 2px solid ${Colors.outline};
    }

    thead tr th {
      color: ${props => props.theme.palette.text.secondary};
      background: ${Colors.background};
    }

    td {
      position: relative;
    }

    tbody tr td.MuiTableCell-body {
      background: ${Colors.white};
      padding: 7px 15px;

      &:first-child {
        padding-left: 17px;
      }
    }
  }
`;

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const CategoryCell = styled.div`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const StyledButton = styled(Button)`
  position: absolute;
  padding: 0;
  text-transform: none;
  font-weight: 400;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0;
`;

export const PatientLabTestsTable = React.memo(({ patient, searchParameters }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const { data, isLoading } = usePatientLabTestResults(patient.id, {
    page,
    rowsPerPage,
    ...searchParameters,
  });
  const [modalLabTestId, setModalLabTestId] = useState();
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = id => {
    if (id) {
      setModalLabTestId(id);
      setModalOpen(true);
    }
  };

  const allDates = isLoading
    ? []
    : Object.keys(Object.assign({}, ...data?.data.map(x => x.results)));
  const columns = [
    {
      key: 'testCategory.id',
      title: 'Test category',
      accessor: row => <CategoryCell>{row.testCategory}</CategoryCell>,
    },
    {
      key: 'testType',
      title: 'Test type',
      accessor: row => (
        <CategoryCell>
          {row.testType}
          <br />
          {row.unit ? `(${row.unit})` : null}
        </CategoryCell>
      ),
    },
    {
      key: 'normalRange',
      title: 'Normal range',
      accessor: row => {
        const range = row.normalRanges[patient?.sex];
        const value = !range.min ? '-' : `${range.min}-${range.max}`;
        return <CategoryCell>{value}</CategoryCell>;
      },
    },
    ...allDates
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        title: <DateHeadCell value={date} />,
        sortable: false,
        key: date,
        accessor: row => {
          const normalRange = row.normalRanges[patient?.sex];
          const cellData = row.results[date];
          if (cellData) {
            return (
              <StyledButton onClick={() => openModal(cellData.id)}>
                <RangeValidatedCell
                  value={cellData.result}
                  config={{ unit: row.unit }}
                  validationCriteria={{ normalRange: normalRange?.min ? normalRange : null }}
                />
              </StyledButton>
            );
          }

          return '-';
        },
      })),
  ];

  return (
    <>
      <StyledTable
        elevated={false}
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
        page={page}
        rowsPerPage={rowsPerPage}
        onChangeRowsPerPage={setRowsPerPage}
        onChangePage={setPage}
        count={data?.count}
        allowExport
        exportName="PatientResults"
      />
      <LabTestResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        labTestId={modalLabTestId}
      />
    </>
  );
});
