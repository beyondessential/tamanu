import { Button } from '@material-ui/core';
import GetAppIcon from '@mui/icons-material/GetApp';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  EditedEntryLegend,
  OutlinedButton,
  TranslatedOption,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import { getLabTestValidationCriteriaFromNormalRanges } from '@tamanu/utils/labTests';
import { BodyText } from '../../components';
import { DateHeadCell, RangeValidatedCell } from '../../components/FormattedTableCell';
import { Table } from '../../components/Table';
import { Colors } from '../../constants/styles';
import { LabTestResultModal } from './LabTestResultModal';

const INDIVIDUAL_GROUP_ID = '__individual__';

// White-header style, matching the lab request results table. The test and normal-range columns are
// no longer frozen (as in the agreed mockup), so the whole table scrolls horizontally when there are
// many result dates.
const StyledTable = styled(Table)`
  table {
    table-layout: fixed;
  }

  thead tr th {
    color: ${Colors.midText};
    font-weight: 400;
    vertical-align: middle;
    white-space: nowrap;
  }

  tbody tr td.MuiTableCell-body {
    padding: 7px 15px;
    vertical-align: middle;

    &:first-child {
      padding-left: 20px;
    }
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tfoot {
    background: ${Colors.white};
  }

  th:nth-child(1),
  td:nth-child(1) {
    width: 220px;
  }
  th:nth-child(2),
  td:nth-child(2) {
    width: 120px;
  }
  th:nth-child(n + 3),
  td:nth-child(n + 3) {
    width: 120px;
  }
  th:last-child,
  td:last-child {
    width: auto;
  }
`;

// Test names and normal ranges read in the same regular weight and colour as the results themselves.
// Tests shown under a panel or "Individual tests" heading are indented from it.
const TestTypeCell = styled.div`
  color: ${Colors.darkestText};
  font-weight: 400;
  padding-left: ${props => (props.$indented ? '20px' : '0')};
`;

const RangeCell = styled.div`
  color: ${Colors.darkestText};
  font-weight: 400;
`;

const StyledButton = styled(Button)`
  text-transform: none;
  font-weight: 400;
  border-radius: 10px;
  padding: 8px 4px;
  justify-content: left;
  & > span > div {
    margin: -8px -4px;
  }
  &:hover {
    background-color: transparent;
  }
`;

const ResultsExportButton = ({ onClick }) => (
  <OutlinedButton
    onClick={onClick}
    startIcon={<GetAppIcon data-testid="getappicon-export" />}
    data-testid="resultsexportbutton"
  >
    <TranslatedText stringId="general.action.export" fallback="Export" data-testid="translatedtext-export" />
  </OutlinedButton>
);

export const PatientLabTestsTable = React.memo(
  ({ patient, labTests = [], groups = [], isLoading }) => {
    const { formatShort, formatTimeWithSeconds } = useDateTime();
    const [modalLabTestId, setModalLabTestId] = useState();
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = id => {
      if (id) {
        setModalLabTestId(id);
        setModalOpen(true);
      }
    };
    const showEditedEntryLegend = labTests.some(test =>
      Object.values(test.results ?? {}).some(result => result.isEdited === true),
    );

    // Panels first (the backend returns them A–Z), each with its member tests in configured order;
    // then every other displayed test, A–Z, under an "Individual tests" heading. A test that sits
    // under a panel is not repeated as an individual test (R11).
    const { rows, hasRows } = useMemo(() => {
      const byTypeId = new Map(labTests.map(test => [test.testTypeId, test]));
      const displayRows = [];
      const groupedTypeIds = new Set();

      for (const group of groups) {
        for (const testTypeId of group.testTypeIds) {
          const test = byTypeId.get(testTypeId);
          if (!test) continue;
          groupedTypeIds.add(testTypeId);
          displayRows.push({
            ...test,
            rowKey: `${group.id}:${testTypeId}`,
            groupId: group.id,
            groupName: group.name,
            grouped: true,
          });
        }
      }

      const individualTests = labTests
        .filter(test => !groupedTypeIds.has(test.testTypeId))
        .sort((a, b) => (a.testType ?? '').localeCompare(b.testType ?? ''));
      for (const test of individualTests) {
        displayRows.push({
          ...test,
          rowKey: `${INDIVIDUAL_GROUP_ID}:${test.testTypeId}`,
          groupId: INDIVIDUAL_GROUP_ID,
          grouped: true,
        });
      }

      return { rows: displayRows, hasRows: displayRows.length > 0 };
    }, [labTests, groups]);

    const getRowGroupHeader = useMemo(() => {
      if (!hasRows) return undefined;
      return (row, previousRow) => {
        if (previousRow && previousRow.groupId === row.groupId) return null;
        if (row.groupId === INDIVIDUAL_GROUP_ID) {
          return (
            <TranslatedText
              stringId="patient.lab.results.table.individualTests"
              fallback="Individual tests"
              data-testid="translatedtext-individualtests"
            />
          );
        }
        return (
          <TranslatedReferenceData
            value={row.groupId}
            fallback={row.groupName}
            category="labTestPanel"
            data-testid="translatedreferencedata-panelheading"
          />
        );
      };
    }, [hasRows]);

    const allDates = isLoading
      ? []
      : Object.keys(Object.assign({}, ...labTests.map(test => test.results ?? {})));

    const columns = [
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
          <TestTypeCell $indented={row.grouped} data-testid="testtypecell-7aet">
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
          </TestTypeCell>
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
          const range = row.normalRanges?.[patient?.sex];
          const value =
            range?.min != null && range?.max != null
              ? `${range.min}–${range.max}`
              : (row.rangeText ?? '—');
          return <RangeCell data-testid="rangecell-1fi2">{value}</RangeCell>;
        },
        sortable: false,
      },
      ...allDates
        .sort((a, b) => b.localeCompare(a))
        .map((date, index) => ({
          title: <DateHeadCell value={date} data-testid={`dateheadcell-qvnq-${index}`} />,
          sortable: false,
          key: date,
          accessor: row => {
            const cellData = row.results[date];
            if (cellData) {
              const isEdited = cellData.isEdited === true;
              return (
                <StyledButton
                  onClick={() => openModal(cellData.id)}
                  data-testid={`styledbutton-d5us-${index}`}
                >
                  {row.testOptions ? (
                    <>
                      <TranslatedOption
                        value={cellData.result}
                        referenceDataId={row.testTypeId}
                        referenceDataCategory="labTestType"
                      />
                      {isEdited && '*'}
                    </>
                  ) : (
                    <RangeValidatedCell
                      value={cellData.result}
                      config={{ unit: row.unit, rounding: null }}
                      validationCriteria={getLabTestValidationCriteriaFromNormalRanges({
                        normalRanges: row.normalRanges,
                        rangeText: row.rangeText,
                        labTest: {
                          referenceRangeMin: cellData.referenceRangeMin,
                          referenceRangeMax: cellData.referenceRangeMax,
                          referenceRangeText: cellData.referenceRangeText,
                        },
                        sex: patient?.sex,
                      })}
                      isEdited={isEdited}
                      data-testid={`rangevalidatedcell-ebuf-${index}`}
                    />
                  )}
                </StyledButton>
              );
            }

            return (
              <StyledButton disabled data-testid={`styledbutton-l8dl-${index}`}>
                <TranslatedText
                  stringId="general.fallback.notApplicable"
                  fallback="N/A"
                  data-testid="translatedtext-n987"
                />
              </StyledButton>
            );
          },
          exportOverrides: {
            title: `${formatShort(date)} ${formatTimeWithSeconds(date)}`,
          },
        })),
    ];

    return (
      <>
        <StyledTable
          elevated={false}
          headerColor={Colors.white}
          columns={columns}
          data={rows}
          isLoading={isLoading}
          noDataMessage={
            <TranslatedText
              stringId="patient.lab.results.table.noData"
              fallback="This patient has no lab results to display. Once lab results are available they will be displayed here."
              data-testid="translatedtext-2i86"
            />
          }
          count={rows.length}
          allowExport
          exportName="PatientResults"
          ExportButton={ResultsExportButton}
          getRowGroupHeader={getRowGroupHeader}
          rowIdKey="rowKey"
          data-testid="styledtable-u2v9"
        />
        {showEditedEntryLegend && <EditedEntryLegend data-testid="box-q7pq" />}
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
