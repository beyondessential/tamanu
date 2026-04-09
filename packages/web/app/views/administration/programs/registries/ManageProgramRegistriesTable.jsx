import React from 'react';
import { useParams } from 'react-router';

import { ContentUnavailableView, TranslatedText } from '@tamanu/ui-components';
import { ColourCell, StyledDataFetchingTable, VisibilityStatusCell } from './components';

const codeColumn = /** @type {const} */ ({
  key: 'code',
  title: <TranslatedText stringId="admin.programRegistries.table.column.code" fallback="Code" />,
});

const nameColumn = /** @type {const} */ ({
  key: 'name',
  title: <TranslatedText stringId="admin.programRegistries.table.column.name" fallback="Name" />,
});

const visibilityStatusColumn = /** @type {const} */ ({
  accessor: VisibilityStatusCell,
  key: 'visibilityStatus',
  title: (
    <TranslatedText
      stringId="admin.programRegistries.table.column.visibilityStatus"
      fallback="Visibility status"
    />
  ),
});

const programRegistryClinicalStatusesColumns = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  {
    key: 'color',
    title: (
      <TranslatedText stringId="admin.programRegistries.table.column.colour" fallback="Colour" />
    ),
    accessor: ColourCell,
  },
  visibilityStatusColumn,
]);

function ManageProgramRegistriesTable({ columns, endpointSuffix, noDataMessage, dataTestId }) {
  const { programRegistryId } = useParams();
  const endpoint = programRegistryId
    ? `admin/programRegistry/${encodeURIComponent(programRegistryId)}/${endpointSuffix}`
    : '';

  return (
    <StyledDataFetchingTable
      columns={columns}
      endpoint={endpoint}
      initialSort={{ orderBy: 'name', order: 'asc' }}
      noDataMessage={noDataMessage}
      data-testid={dataTestId}
    />
  );
}

export function ClinicalStatusesTable() {
  return (
    <ManageProgramRegistriesTable
      columns={programRegistryClinicalStatusesColumns}
      endpointSuffix="programRegistryClinicalStatuses"
      noDataMessage={
        <ContentUnavailableView
          heading={
            <TranslatedText
              stringId="admin.programRegistries.clinicalStatuses.noData.heading"
              fallback="No clinical statuses"
            />
          }
          description={
            <TranslatedText
              stringId="admin.programRegistries.clinicalStatuses.noData.description"
              fallback="No clinical statuses found for this program registry"
            />
          }
        />
      }
      dataTestId="program-registry-clinical-statuses-table"
    />
  );
}

const conditionsColumns = /** @type {const} */ ([codeColumn, nameColumn, visibilityStatusColumn]);

export function ConditionsTable() {
  return (
    <ManageProgramRegistriesTable
      columns={conditionsColumns}
      endpointSuffix="programRegistryConditions"
      noDataMessage={
        <ContentUnavailableView
          heading={
            <TranslatedText
              stringId="admin.programRegistries.conditions.noData.heading"
              fallback="No related conditions"
            />
          }
          description={
            <TranslatedText
              stringId="admin.programRegistries.conditions.noData.description"
              fallback="No related conditions found for this program registry"
            />
          }
        />
      }
      dataTestId="program-registry-conditions-table"
    />
  );
}

const relatedConditionCategoriesColumns = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  visibilityStatusColumn,
]);

export function RelatedConditionCategoriesTable() {
  return (
    <ManageProgramRegistriesTable
      columns={relatedConditionCategoriesColumns}
      endpointSuffix="programRegistryConditionCategories"
      noDataMessage={
        <ContentUnavailableView
          heading={
            <TranslatedText
              stringId="admin.programRegistries.conditionCategories.noData.heading"
              fallback="No related condition categories"
            />
          }
          description={
            <TranslatedText
              stringId="admin.programRegistries.conditionCategories.noData.description"
              fallback="No related condition categories found for this program registry"
            />
          }
        />
      }
      dataTestId="program-registry-condition-categories-table"
    />
  );
}
