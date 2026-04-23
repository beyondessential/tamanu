/**
 * Column names in this table are not translated, as they should mirror those from
 * imported/exported spreadsheets.
 */

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  ContentUnavailableView,
  TAMANU_COLORS,
  TranslatedText,
  VisuallyHidden,
} from '@tamanu/ui-components';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { NullableBooleanCell, VisibilityStatusCell } from '../components';
import { StyledDataFetchingTable } from '../registries/components';
import { EditProgramSurveyMetadataModal } from './EditProgramSurveyMetadataModal';
import { useSurveyVisibilityStatusMutation } from './useSurveyVisibilityStatusMutation';

/** Aligns with padding of StyledTableCell from Table.jsx */
const UnorderedList = styled.ul`
  padding-inline-start: 15px;
`;

function NotifyEmailAddressesCell({ notifyEmailAddresses }) {
  if (!Array.isArray(notifyEmailAddresses) || notifyEmailAddresses.length === 0) {
    return (
      <em style={{ color: TAMANU_COLORS.softText }}>
        <TranslatedText stringId="general.none" fallback="None" />
      </em>
    );
  }
  return (
    <UnorderedList>
      {notifyEmailAddresses
        .sort((a, b) => a.localeCompare(b))
        .map(email => (
          <li key={email}>{email}</li>
        ))}
    </UnorderedList>
  );
}

function ActionMenu({
  code,
  id,
  isSensitive,
  name,
  notifiable,
  notifyEmailAddresses,
  refreshTable,
  surveyType,
  visibilityStatus,
}) {
  const [isEditMetadataOpen, setIsEditMetadataOpen] = useState(false);

  const { isLoading, mutateAsync } = useSurveyVisibilityStatusMutation(id);
  const updateVisibilityStatus = nextVisibilityStatus =>
    mutateAsync({ visibilityStatus: nextVisibilityStatus }, { onSuccess: () => refreshTable?.() });

  const items = [
    {
      label: (
        <TranslatedText
          stringId="admin.programs.surveys.editFormMetadata"
          fallback="Edit form metadata"
        />
      ),
      onClick: () => setIsEditMetadataOpen(true),
    },
  ];
  if (visibilityStatus === VISIBILITY_STATUSES.CURRENT) {
    items.push({
      disabled: isLoading,
      label: (
        <TranslatedText
          stringId="admin.programs.surveys.table.action.makeHistorical"
          fallback="Make historical"
        />
      ),
      onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.HISTORICAL),
    });
  } else if (visibilityStatus === VISIBILITY_STATUSES.HISTORICAL) {
    items.push({
      disabled: isLoading,
      label: (
        <TranslatedText
          stringId="admin.programs.surveys.table.action.makeCurrent"
          fallback="Make current"
        />
      ),
      onClick: () => updateVisibilityStatus(VISIBILITY_STATUSES.CURRENT),
    });
  }

  const survey = useMemo(
    () => ({
      code,
      id,
      isSensitive,
      name,
      notifiable,
      notifyEmailAddresses,
      surveyType,
      visibilityStatus,
    }),
    [code, id, isSensitive, name, notifiable, notifyEmailAddresses, surveyType, visibilityStatus],
  );

  return (
    <>
      <ThreeDotMenu items={items} />
      <EditProgramSurveyMetadataModal
        onClose={() => setIsEditMetadataOpen(false)}
        onSave={() => refreshTable?.()}
        open={isEditMetadataOpen}
        survey={survey}
      />
    </>
  );
}

const programSurveyColumns = /** @type {const} */ ([
  { key: 'code', title: 'code' },
  { key: 'name', title: 'name' },
  { key: 'surveyType', title: 'surveyType' },
  {
    key: 'isSensitive',
    title: 'isSensitive',
    accessor: ({ isSensitive }) => <NullableBooleanCell value={isSensitive} />,
  },
  {
    accessor: VisibilityStatusCell,
    key: 'visibilityStatus',
    title: 'visibilityStatus',
  },
  {
    key: 'notifiable',
    title: 'notifiable',
    accessor: ({ notifiable }) => <NullableBooleanCell value={notifiable} />,
  },
  {
    accessor: NotifyEmailAddressesCell,
    key: 'notifyEmailAddresses',
    title: 'notifyEmailAddresses',
    sortable: false,
  },
  {
    accessor: ActionMenu,
    dontCallRowInput: true,
    isExportable: false,
    key: 'actions',
    numeric: true,
    sortable: false,
    title: (
      <VisuallyHidden>
        <TranslatedText stringId="admin.programs.surveys.table.column.actions" fallback="Actions" />
      </VisuallyHidden>
    ),
  },
]);

export function ManageProgramSurveysTable({ programId, ...props }) {
  const endpoint = `admin/program/${encodeURIComponent(programId)}/surveys`;

  return (
    <StyledDataFetchingTable
      columns={programSurveyColumns}
      endpoint={endpoint}
      initialSort={{ orderBy: 'name', order: 'asc' }}
      noDataMessage={
        <ContentUnavailableView
          heading={
            <TranslatedText stringId="admin.programs.forms.noData.heading" fallback="No forms" />
          }
          description={
            <TranslatedText
              stringId="admin.programs.forms.noData.description"
              fallback="No forms found for this program"
            />
          }
        />
      }
      data-testid="program-forms-table"
      {...props}
    />
  );
}
