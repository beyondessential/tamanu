import React from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from '../../../components';

import { getCompletedDate, getMethod } from '../../../utils/lab';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';

const StyledDataFetchingTable = styled(DataFetchingTable)`
  table tbody tr:last-child td {
    border-bottom: none;
  }

  table thead tr th {
    position: sticky;
    top: 0;
  }
`;

const makeRangeStringAccessor = sex => ({ labTestType }) => {
  const max = sex === 'male' ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === 'male' ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = max || max === 0;
  const hasMin = min || min === 0;

  if (hasMin && hasMax) return `${min} – ${max}`;
  if (hasMin) return `>${min}`;
  if (hasMax) return `<${max}`;
  return 'N/A';
};

const columns = sex => [
  {
    title: <TranslatedText
      stringId="lab.testType.label"
      fallback="Test type"
      data-test-id='translatedtext-0z51' />,
    key: 'labTestType.name',
    accessor: row => <TranslatedReferenceData
      fallback={row.labTestType.name}
      value={row.labTestType.id}
      category="labTestType"
      data-test-id='translatedreferencedata-dvhf' />,
  },
  {
    title: <TranslatedText
      stringId="lab.results.table.column.result"
      fallback="Result"
      data-test-id='translatedtext-zh87' />,
    key: 'result',
    accessor: ({ result }) => result ?? '',
  },
  {
    title: <TranslatedText
      stringId="lab.results.table.column.unit"
      fallback="Units"
      data-test-id='translatedtext-fqte' />,
    key: 'labTestType.unit',
    accessor: ({ labTestType }) => labTestType?.unit || 'N/A',
  },
  {
    title: <TranslatedText
      stringId="lab.results.table.column.reference"
      fallback="Reference"
      data-test-id='translatedtext-1uls' />,
    key: 'reference',
    accessor: makeRangeStringAccessor(sex),
    sortable: false,
  },
  {
    title: <TranslatedText
      stringId="lab.results.table.column.labTestMethod"
      fallback="Method"
      data-test-id='translatedtext-mntb' />,
    key: 'labTestMethod',
    accessor: getMethod,
    sortable: false,
  },
  {
    title: (
      <TranslatedText
        stringId="lab.results.table.column.laboratoryOfficer"
        fallback="Lab officer"
        data-test-id='translatedtext-5lz1' />
    ),
    key: 'laboratoryOfficer',
  },
  {
    title: (
      <TranslatedText
        stringId="lab.results.table.column.verification"
        fallback="Verification"
        data-test-id='translatedtext-cr0s' />
    ),
    key: 'verification',
  },
  {
    title: (
      <TranslatedText
        stringId="lab.results.table.column.completedDate"
        fallback="Completed"
        data-test-id='translatedtext-ucwd' />
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
    />
  );
});
