import React, { useMemo } from 'react';
import styled from 'styled-components';

import { getReferenceRange } from '@tamanu/utils/labTests';

import { DataFetchingTable } from '../../../components';
import { getCompletedDate, getMethod } from '../../../utils/lab';
import { useTranslation } from '../../../contexts/Translation';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';
import { TranslatedOption } from '../../../components/Translation/TranslatedOptions';
import { ConditionalTooltip } from '../../../components/Tooltip';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  table tbody tr:last-child td {
    border-bottom: none;
  }

  table thead tr th {
    position: sticky;
    top: 0;
  }
`;

export const LabRequestResultsTable = React.memo(({ labRequest, patient, refreshCount }) => {
  const { getTranslation } = useTranslation();
  const columns = useMemo(
    () => [
      {
        title: (
          <TranslatedText
            stringId="lab.testType.label"
            fallback="Test type"
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
        accessor: ({ labTestType, result, secondaryResult }) => {
          const { options, id: labTestTypeId } = labTestType;

          let displayResult;
          if (options && options.length > 0) {
            displayResult = (
              <TranslatedOption
                value={result}
                referenceDataId={labTestTypeId}
                referenceDataCategory="labTestType"
              />
            );
          } else {
            displayResult = result ?? '';
          }

          return (
            <ConditionalTooltip
              visible={!!secondaryResult}
              title={getTranslation(
                'lab.results.tooltip.secondaryResult',
                'Secondary result: :secondaryResult',
                { replacements: { secondaryResult } },
              )}
            >
              {displayResult}
            </ConditionalTooltip>
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
        accessor: ({ labTestType }) =>
          getReferenceRange({ labTestType, sex: patient.sex, getTranslation }),
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
        accessor: getMethod,
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
        accessor: getCompletedDate,
        sortable: false,
      },
    ],
    [getTranslation, patient.sex],
  );

  return (
    <StyledDataFetchingTable
      columns={columns}
      endpoint={`labRequest/${labRequest.id}/tests`}
      initialSort={{ order: 'asc', orderBy: 'id' }}
      disablePagination
      elevated={false}
      refreshCount={refreshCount}
      data-testid="styleddatafetchingtable-brdm"
    />
  );
});
