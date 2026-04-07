import React from 'react';
import { useParams } from 'react-router';

import { TranslatedText } from '@tamanu/ui-components';

import { ColourCell, StyledDataFetchingTable, VisibilityStatusCell } from './components';

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
    key: 'color',
    title: (
      <TranslatedText stringId="admin.programRegistries.table.column.colour" fallback="Colour" />
    ),
    accessor: ColourCell,
  },
  {
    key: 'visibilityStatus',
    title: (
      <TranslatedText
        stringId="admin.programRegistries.table.column.visibilityStatus"
        fallback="Visibility status"
      />
    ),
    accessor: VisibilityStatusCell,
  },
]);

export function ClinicalStatusesTable() {
  const { programRegistryId } = useParams();
  const endpoint = programRegistryId
    ? `admin/programRegistries/${encodeURIComponent(programRegistryId)}/programRegistryClinicalStatuses`
    : '';

  return (
    <StyledDataFetchingTable
      columns={columns}
      endpoint={endpoint}
      initialSort={{ orderBy: 'name', order: 'asc' }}
      noDataMessage={
        <TranslatedText
          stringId="admin.programRegistries.clinicalStatuses.noData"
          fallback="No clinical statuses found for this program registry"
        />
      }
      data-testid="program-registry-clinical-statuses-table"
    />
  );
}
