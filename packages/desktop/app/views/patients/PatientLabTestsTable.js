import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { Table } from '../../components/Table';
import { RangeValidatedCell, DateHeadCell } from '../../components/FormattedTableCell';
import { Colors } from '../../constants';
import { LabTestResultModal } from './LabTestResultModal';
import { BodyText, DateDisplay, formatTimeWithSeconds } from '../../components';

const COLUMN_WIDTHS = [150, 120, 120];

const StyledTable = styled(Table)`
  table {
    table-layout: fixed;
    position: relative;
    width: initial;

    thead tr th:nth-child(-n + ${props => props.$stickyColumns}),
    tbody tr td:nth-child(-n + ${props => props.$stickyColumns}) {
      position: sticky;
      z-index: 1;
      border-right: 1px solid ${Colors.outline};
    }

    thead tr th:nth-child(${props => props.$stickyColumns}),
    tbody tr td:nth-child(${props => props.$stickyColumns}) {
      border-right: 2px solid ${Colors.outline};
    }

    ${props =>
      COLUMN_WIDTHS.slice(0, props.$stickyColumns)
        .map(
          (width, index) => `
      thead tr th:nth-child(${index + 1}),
      tbody tr td:nth-child(${index + 1}) {
        width: ${width}px;
        min-width: ${width}px;
        max-width: ${width}px;
        left: ${COLUMN_WIDTHS.slice(0, index).reduce((acc, n) => acc + n, 0)}px;
      }
    `,
        )
        .join('\n')}

    tfoot {
      inset-inline-end: 0;
    }

    thead tr th:nth-child(n + 4),
    tbody tr td:nth-child(n + 4) {
      width: 120px;
    }

    thead tr th:last-child,
    tbody tr td:last-child {
      width: 100%;
    }

    thead tr th {
      color: ${props => props.theme.palette.text.secondary};
      background: ${Colors.background};
      white-space: break-spaces;
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

    tfoot tr td button.MuiButton-root {
      position: sticky;
      left: 16px;
    }
  }
`;

const CategoryCell = styled.div`
  font-weight: 500;
  color: ${Colors.darkText};
`;

const StyledButton = styled(Button)`
  text-transform: none;
  font-weight: 400;
  border-radius: 10px;
  padding: 8px 4px;
  justify-content: left;
  position: relative;
  left: -14px;
  & > span > div {
    margin: -8px -4px;
  }
  &:hover {
    background-color: transparent;
  }
`;

const getTitle = value => {
  const date = DateDisplay.stringFormat(value);
  const timeWithSeconds = DateDisplay.stringFormat(value, formatTimeWithSeconds);
  return `${date} ${timeWithSeconds}`;
};

export const PatientLabTestsTable = React.memo(
  ({ patient, labTests = [], count, isLoading, searchParameters }) => {
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
      : Object.keys(Object.assign({}, ...labTests.map(x => x.results)));

    const stickyColumns = [
      // Only include category column if not filtering by category
      ...(!searchParameters.categoryId
        ? [
            {
              key: 'testCategory.id',
              title: 'Test category',
              accessor: row => <CategoryCell>{row.testCategory}</CategoryCell>,
              sortable: false,
            },
          ]
        : []),
      {
        key: 'testType',
        title: 'Test type',
        accessor: row => (
          <CategoryCell>
            {row.testType}
            <br />
            <BodyText color="textTertiary">{row.unit ? `(${row.unit})` : null}</BodyText>
          </CategoryCell>
        ),
        sortable: false,
      },
      {
        key: 'normalRange',
        title: 'Normal range',
        accessor: row => {
          const range = row.normalRanges[patient?.sex];
          const value = !range.min ? '-' : `${range.min}-${range.max}`;
          return <CategoryCell>{value}</CategoryCell>;
        },
        sortable: false,
      },
    ];

    const columns = [
      ...stickyColumns,
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
                    config={{ unit: row.unit, rounding: null }}
                    validationCriteria={{ normalRange: normalRange?.min ? normalRange : null }}
                  />
                </StyledButton>
              );
            }

            return <StyledButton disabled>-</StyledButton>;
          },
          exportOverrides: {
            title: `${getTitle(date)}`,
            accessor: row => row.results[date]?.result || '-',
          },
        })),
    ];

    return (
      <>
        <StyledTable
          elevated={false}
          columns={columns}
          data={labTests}
          isLoading={isLoading}
          noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
          count={count}
          allowExport
          exportName="PatientResults"
          $stickyColumns={stickyColumns.length}
        />
        <LabTestResultModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          labTestId={modalLabTestId}
        />
      </>
    );
  },
);
