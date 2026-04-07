import React, { useMemo } from 'react';
import { useParams } from 'react-router';

import { TranslatedText } from '@tamanu/ui-components';
import { StyledDataFetchingTable } from '../../users/components';

import { VisibilityCell } from './components';

const columns = /** @type {const} */ ([
  {
    key: 'code',
    title: <TranslatedText stringId="admin.programRegistries.table.column.code" fallback="Code" />,
  },
  {
    key: 'name',
    title: <TranslatedText stringId="admin.programRegistries.table.column.name" fallback="Name" />,
  },
  {
    key: 'visibilityStatus',
    title: (
      <TranslatedText
        stringId="admin.programRegistries.table.column.visibilityStatus"
        fallback="Visibility"
      />
    ),
    accessor: VisibilityCell,
  },
]);

export function ConditionsTable() {
  const { programRegistryId } = useParams();
  const endpoint = programRegistryId
    ? `admin/programRegistries/${encodeURIComponent(programRegistryId)}/programRegistryConditions`
    : '';

  return (
    <StyledDataFetchingTable
      columns={columns}
      endpoint={endpoint}
      initialSort={{ orderBy: 'name', order: 'asc' }}
      noDataMessage={
        <TranslatedText
          stringId="admin.programRegistries.conditions.noData"
          fallback="No related conditions found for this program registry"
        />
      }
      data-testid="program-registry-conditions-table"
    />
  );
}
