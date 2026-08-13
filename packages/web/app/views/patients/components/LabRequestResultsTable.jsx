import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { LAB_TEST_RESULT_TYPES } from '@tamanu/constants';
import { getLabTestValidationCriteria, getReferenceRange } from '@tamanu/utils/labTests';
import { EditedEntryLegend, EditedOrnament } from '@tamanu/ui-components';

import { DataFetchingTable } from '../../../components';
import { RangeValidatedCell } from '../../../components/FormattedTableCell';
import { getCompletedDate, getMethod } from '../../../utils/lab';
import { useTranslation } from '../../../contexts/Translation';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';
import { TranslatedOption } from '../../../components/Translation/TranslatedOptions';
import { ConditionalTooltip } from '../../../components/Tooltip';
import { LabTestResultModal } from '../LabTestResultModal';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  cursor: pointer;
  table tbody tr:last-child td {
    border-bottom: none;
  }

  table thead tr th {
    position: sticky;
    top: 0;
  }
`;

const ResultCell = styled.span`
  display: inline-block;
`;

export const LabRequestResultsTable = React.memo(({ labRequest, patient, refreshCount }) => {
  const { getTranslation } = useTranslation();
  const [modalLabTestId, setModalLabTestId] = useState();
  const [modalOpen, setModalOpen] = useState(false);
  const [showEditedEntryLegend, setShowEditedEntryLegend] = useState(false);

  const handleRowClick = row => {
    setModalLabTestId(row.id);
    setModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        title: (
          <TranslatedText
            stringId="lab.test.label"
            fallback="Test"
            data-testid="translatedtext-bk9k"
          />
        ),
        key: 'labTestType.name',
        accessor: row => (
          <TranslatedReferenceData
            fallback={row.labTestType.name}
            value={row.labTestType.id}
            category="labTestType"
            data-testid="translatedreferencedata-kplb"
          />
        ),
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.result"
            fallback="Result"
            data-testid="translatedtext-0e13"
          />
        ),
        key: 'result',
        accessor: row => {
          const { labTestType, result, secondaryResult, isEdited: rowIsEdited } = row;
          const {
            options,
            id: labTestTypeId,
            supportsSecondaryResults,
            unit,
            resultType,
          } = labTestType;
          const isEdited = rowIsEdited === true;
          const hasSecondaryResult = Boolean(supportsSecondaryResults && secondaryResult);
          const secondaryResultTooltip = getTranslation(
            'lab.results.tooltip.secondaryResult',
            'Secondary result: :secondaryResult',
            { replacements: { secondaryResult } },
          );

          // Only numeric results are range-checked. Option and free-text results are shown
          // verbatim — free-text must not pass through numeric formatting — and never flagged.
          if (resultType !== LAB_TEST_RESULT_TYPES.NUMBER) {
            const displayResult =
              options && options.length > 0 ? (
                <TranslatedOption
                  value={result}
                  referenceDataId={labTestTypeId}
                  referenceDataCategory="labTestType"
                />
              ) : (
                result || '–'
              );
            return (
              <ResultCell>
                <ConditionalTooltip visible={hasSecondaryResult} title={secondaryResultTooltip}>
                  {displayResult}
                  {isEdited && <EditedOrnament />}
                </ConditionalTooltip>
              </ResultCell>
            );
          }

          // Where a numeric result also carries a secondary result, its tooltip takes over
          // from the out-of-range tooltip; the highlight still shows either way.
          const resultCell = (
            <RangeValidatedCell
              value={result}
              config={{ unit, rounding: null }}
              validationCriteria={getLabTestValidationCriteria({
                labTestType,
                labTest: row,
                sex: patient.sex,
              })}
              hideUnitSuffix
              disableTooltip={hasSecondaryResult}
              isEdited={isEdited}
              data-testid="rangevalidatedcell-labrequest"
            />
          );

          return hasSecondaryResult ? (
            <ConditionalTooltip visible title={secondaryResultTooltip}>
              {resultCell}
            </ConditionalTooltip>
          ) : (
            resultCell
          );
        },
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.unit"
            fallback="Units"
            data-testid="translatedtext-hmp2"
          />
        ),
        key: 'labTestType.unit',
        accessor: ({ labTestType }) =>
          labTestType?.unit ||
          getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' }),
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.reference"
            fallback="Reference"
            data-testid="translatedtext-840i"
          />
        ),
        key: 'reference',
        accessor: row =>
          getReferenceRange({
            labTestType: row.labTestType,
            labTest: row,
            sex: patient.sex,
            getTranslation,
          }),
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.labTestMethod"
            fallback="Method"
            data-testid="translatedtext-w6f1"
          />
        ),
        key: 'labTestMethod',
        accessor: row => (row.labTestMethod ? getMethod(row) : '–'),
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.laboratoryOfficer"
            fallback="Lab officer"
            data-testid="translatedtext-qh7q"
          />
        ),
        key: 'laboratoryOfficer',
        accessor: row => row.laboratoryOfficer || '–',
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.verification"
            fallback="Verification"
            data-testid="translatedtext-ldkr"
          />
        ),
        key: 'verification',
        accessor: row => row.verification || '–',
        sortable: false,
      },
      {
        title: (
          <TranslatedText
            stringId="lab.results.table.column.completedDate"
            fallback="Completed"
            data-testid="translatedtext-qwxt"
          />
        ),
        key: 'completedDate',
        accessor: row => (row.completedDate ? getCompletedDate(row) : '–'),
        sortable: false,
      },
    ],
    [getTranslation, patient.sex],
  );

  return (
    <>
      <StyledDataFetchingTable
        columns={columns}
        endpoint={`labRequest/${labRequest.id}/tests`}
        initialSort={{ order: 'asc', orderBy: 'id' }}
        disablePagination
        elevated={false}
        refreshCount={refreshCount}
        onRowClick={handleRowClick}
        onDataFetched={({ data }) =>
          setShowEditedEntryLegend(data.some(row => row.isEdited === true))
        }
        data-testid="styleddatafetchingtable-brdm"
        allowExport={false}
      />
      {showEditedEntryLegend && <EditedEntryLegend data-testid="editedentrylegend-labrequest" />}
      <LabTestResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        labTestId={modalLabTestId}
        includeRequestLink={false}
        data-testid="labtestresultmodal-labrequest"
      />
    </>
  );
});
