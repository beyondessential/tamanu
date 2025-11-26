import React from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from '../../../components';
import { getReferenceRange } from '@tamanu/utils';

import { getCompletedDate, getMethod } from '../../../utils/lab';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';
import { TranslatedOption } from '../../../components/Translation/TranslatedOptions';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  table tbody tr:last-child td {
    border-bottom: none;
  }

  table thead tr th {
    position: sticky;
    top: 0;
  }
`;

const columns = sex => [
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
    accessor: ({ labTestType, result }) => {
      const { options, id: labTestTypeId } = labTestType;
      if (options && options.length > 0) {
        return (
          <TranslatedOption
            value={result}
            referenceDataId={labTestTypeId}
            referenceDataCategory="labTestType"
          />
        );
      }
      return result ?? '';
    },
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
    accessor: ({ labTestType }) => labTestType?.unit || 'N/A',
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
    accessor: ({ labTestType }) => getReferenceRange(labTestType, sex),
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
];

export const LabRequestResultsTable = React.memo(({ labRequest, patient, refreshCount }) => {
  const sexAppropriateColumns = columns(patient.sex);

  return (
    <StyledDataFetchingTable
      columns={sexAppropriateColumns}
      endpoint={`labRequest/${labRequest.id}/tests`}
      initialSort={{ order: 'asc', orderBy: 'id' }}
      disablePagination
      elevated={false}
      refreshCount={refreshCount}
      data-testid="styleddatafetchingtable-brdm"
    />
  );
});
