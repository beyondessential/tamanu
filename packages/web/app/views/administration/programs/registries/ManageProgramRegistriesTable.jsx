/**
 * Column names in these tables are not translated, as they should mirror those from
 * imported/exported spreadsheets.
 */

import React from 'react';
import { useParams } from 'react-router';

import { ContentUnavailableView, TranslatedText, VisuallyHidden } from '@tamanu/ui-components';
import { VisibilityStatusCell } from '../components';
import {
  ColorCell,
  createProgramRegistryRowActionsAccessor,
  StyledDataFetchingTable,
} from './components';

const codeColumn = /** @type {const} */ ({ key: 'code', title: 'code' });

const nameColumn = /** @type {const} */ ({ key: 'name', title: 'name' });

const visibilityStatusColumn = /** @type {const} */ ({
  accessor: VisibilityStatusCell,
  key: 'visibilityStatus',
  title: 'visibilityStatus',
});

const colorColumn = /** @type {const} */ ({ key: 'color', title: 'color', accessor: ColorCell });

const actionsColumnBase = /** @type {const} */ ({
  dontCallRowInput: true,
  isExportable: false,
  key: 'actions',
  numeric: true, // Not really, but sets align="right"
  sortable: false,
  title: (
    <VisuallyHidden>
      <TranslatedText stringId="admin.programRegistries.table.column.actions" fallback="Actions" />
    </VisuallyHidden>
  ),
});

const clinicalStatusesEditFields = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  colorColumn,
  visibilityStatusColumn,
]);

const clinicalStatusesActionsColumn = /** @type {const} */ ({
  ...actionsColumnBase,
  accessor: createProgramRegistryRowActionsAccessor('programRegistryClinicalStatus', {
    fields: clinicalStatusesEditFields,
    title: 'Edit status',
  }),
});

const conditionsEditFields = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  visibilityStatusColumn,
]);

const conditionsActionsColumn = /** @type {const} */ ({
  ...actionsColumnBase,
  accessor: createProgramRegistryRowActionsAccessor('programRegistryCondition', {
    fields: conditionsEditFields,
    title: 'Edit condition',
  }),
});

const conditionCategoriesEditFields = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  visibilityStatusColumn,
]);

const conditionCategoriesActionsColumn = /** @type {const} */ ({
  ...actionsColumnBase,
  accessor: createProgramRegistryRowActionsAccessor('programRegistryConditionCategory', {
    fields: conditionCategoriesEditFields,
    title: 'Edit condition category',
  }),
});

const programRegistryClinicalStatusesColumns = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  colorColumn,
  visibilityStatusColumn,
  clinicalStatusesActionsColumn,
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

const conditionsColumns = /** @type {const} */ ([
  codeColumn,
  nameColumn,
  visibilityStatusColumn,
  conditionsActionsColumn,
]);

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
  conditionCategoriesActionsColumn,
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
