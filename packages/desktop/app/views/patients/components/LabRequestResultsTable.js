import React from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from '../../../components';

import { getCompletedDate, getMethod } from '../../../utils/lab';

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

  if (hasMin && hasMax) return `${min} - ${max}`;
  if (hasMin) return `>${min}`;
  if (hasMax) return `<${max}`;
  return 'N/A';
};

const columns = sex => [
  { title: 'Test type', key: 'labTestType.name', accessor: row => row.labTestType.name },
  {
    title: 'Result',
    key: 'result',
    accessor: ({ result }) => result ?? '',
  },
  {
    title: 'Units',
    key: 'labTestType.unit',
    accessor: ({ labTestType }) => labTestType?.unit || 'N/A',
  },
  {
    title: 'Reference',
    key: 'reference',
    accessor: makeRangeStringAccessor(sex),
    sortable: false,
  },
  { title: 'Method', key: 'labTestMethod', accessor: getMethod, sortable: false },
  { title: 'Lab officer', key: 'laboratoryOfficer' },
  { title: 'Verification', key: 'verification' },
  { title: 'Completed', key: 'completedDate', accessor: getCompletedDate, sortable: false },
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
