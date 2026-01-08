import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { TranslatedText, TranslatedReferenceData, TranslatedOption } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { Table } from '../../components/Table';
import { DateHeadCell, RangeValidatedCell } from '../../components/FormattedTableCell';
import { LabTestResultModal } from './LabTestResultModal';
import { BodyText, DateDisplay } from '../../components';

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

const getTitle = value => (
  <>
    <DateDisplay date={value} showDate /> <DateDisplay date={value} showTime />
  </>
);

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
              title: (
                <TranslatedText
                  stringId="lab.testCategory.label"
                  fallback="Test category"
                  data-testid="translatedtext-0dpy"
                />
              ),
              accessor: row => (
                <CategoryCell data-testid="categorycell-8dsz">{row.testCategory}</CategoryCell>
              ),
              sortable: false,
            },
          ]
        : []),
      {
        key: 'testType',
        title: (
          <TranslatedText
            stringId="patient.lab.results.table.column.testType"
            fallback="Test type"
            data-testid="translatedtext-hrn5"
          />
        ),
        accessor: row => (
          <CategoryCell data-testid="categorycell-7aet">
            <TranslatedReferenceData
              fallback={row.testType}
              value={row.testTypeId}
              category="labTestType"
              data-testid="translatedreferencedata-kplb"
            />
            <br />
            <BodyText color="textTertiary" data-testid="bodytext-zxuk">
              {row.unit ? `(${row.unit})` : null}
            </BodyText>
          </CategoryCell>
        ),
        sortable: false,
      },
      {
        key: 'normalRange',
        title: (
          <TranslatedText
            stringId="patient.lab.results.table.column.normalRange"
            fallback="Normal range"
            data-testid="translatedtext-v8jk"
          />
        ),
        accessor: row => {
          const range = row.normalRanges[patient?.sex];
          const value = !range.min
            ? '—' // em dash
            : `${range.min}–${range.max}`; // en dash
          return <CategoryCell data-testid="categorycell-1fi2">{value}</CategoryCell>;
        },
        sortable: false,
      },
    ];

    const columns = [
      ...stickyColumns,
      ...allDates
        .sort((a, b) => b.localeCompare(a))
        .map((date, index) => ({
          title: <DateHeadCell value={date} data-testid={`dateheadcell-qvnq-${index}`} />,
          sortable: false,
          key: date,
          accessor: row => {
            const normalRange = row.normalRanges[patient?.sex];
            const cellData = row.results[date];
            if (cellData) {
              return (
                <StyledButton
                  onClick={() => openModal(cellData.id)}
                  data-testid={`styledbutton-d5us-${index}`}
                >
                  {row.testOptions ? (
                    <TranslatedOption
                      value={cellData.result}
                      referenceDataId={row.testTypeId}
                      referenceDataCategory="labTestType"
                    />
                  ) : (
                    <RangeValidatedCell
                      value={cellData.result}
                      config={{ unit: row.unit, rounding: null }}
                      validationCriteria={{ normalRange: normalRange?.min ? normalRange : null }}
                      data-testid={`rangevalidatedcell-ebuf-${index}`}
                    />
                  )}
                </StyledButton>
              );
            }

            return (
              <StyledButton disabled data-testid={`styledbutton-l8dl-${index}`}>
                &mdash;
              </StyledButton>
            );
          },
          exportOverrides: {
            title: `${getTitle(date)}`,
            accessor: row => row.results[date]?.result || '—', // em dash
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
          noDataMessage={
            <TranslatedText
              stringId="patient.lab.results.table.noData"
              fallback="This patient has no lab results to display. Once lab results are available they will be displayed here."
              data-testid="translatedtext-2i86"
            />
          }
          count={count}
          allowExport
          exportName="PatientResults"
          $stickyColumns={stickyColumns.length}
          rowIdKey="testType"
          data-testid="styledtable-u2v9"
        />
        <LabTestResultModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          labTestId={modalLabTestId}
          data-testid="labtestresultmodal-gngm"
        />
      </>
    );
  },
);
