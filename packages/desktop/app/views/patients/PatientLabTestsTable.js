import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { Table } from '../../components/Table';
import { RangeValidatedCell, DateHeadCell } from '../../components/FormattedTableCell';
import { Colors } from '../../constants';
import { LabTestResultModal } from './LabTestResultModal';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../components/PatientNavigation';

const COLUMNS = {
  1: 150,
  2: 120,
  3: 120,
};

const StyledTable = styled(Table)`
  max-height: calc(100vh - 300px)
  table {
    table-layout: fixed;
    position: relative;
    width: initial;
    border-collapse: separate;

    thead tr th:nth-child(-n + 3),
    tbody tr td:nth-child(-n + 3) {
      position: sticky;
      z-index: 3;
      border-right: 1px solid ${Colors.outline};
    }

    tbody tr td:nth-child(-n + 3) {
      z-index: 2;
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

    tfoot tr td {
      background: ${Colors.background};
      position: sticky;
      bottom: 0;
      left: 0;
      border-top: 1px solid ${Colors.outline};
      border-bottom: 1px solid ${Colors.background};
      z-index: 4;
    }

    tfoot {
      inset-inline-end: 0;
    }

    tbody tr td:nth-child(n + 4) {
      width: 120px;
      padding: 7px 15px;
    }

    thead tr th:nth-child(n + 4) {
      width: 120px;
      padding: 15px 29px;
    }

    thead tr th:last-child,
    tbody tr td:last-child {
      width: 100%;
    }

    tbody tr:last-child td {
      border-bottom: none;

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

const CategoryCell = styled.div`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const StyledButton = styled(Button)`
  text-transform: none;
  font-weight: 400;
  border-radius: 10px;
  text-align: start;
  min-width: 0;
  padding: 8px 4px;
  & > span > div {
    margin: -8px -4px;
  }
`;
export const PatientLabTestsTable = React.memo(({ patient, labTests = [], count, isLoading }) => {
  const [modalLabTestId, setModalLabTestId] = useState();
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = id => {
    if (id) {
      setModalLabTestId(id);
      setModalOpen(true);
    }
  };

  const allDates = isLoading ? [] : Object.keys(Object.assign({}, ...labTests.map(x => x.results)));
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

          return <StyledButton disabled>-</StyledButton>;
        },
      })),
  ];

  return (
    <>
      <StyledTable
        stickyHeader
        elevated={false}
        columns={columns}
        data={labTests}
        isLoading={isLoading}
        noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
        count={count}
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
