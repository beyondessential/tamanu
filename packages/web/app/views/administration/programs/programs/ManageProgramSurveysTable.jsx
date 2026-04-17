/**
 * Column names in this table are not translated, as they should mirror those from
 * imported/exported spreadsheets.
 */

import React from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { ContentUnavailableView, TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { NullableBooleanCell, VisibilityStatusCell } from '../components';
import { StyledDataFetchingTable } from '../registries/components';

const Caps = styled.span`
  text-transform: uppercase;
`;

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

const programSurveyColumns = /** @type {const} */ ([
  { key: 'code', title: 'code' },
  { key: 'name', title: 'name' },
  { key: 'surveyType', title: 'surveyType' },
  {
    key: 'isSensitive',
    title: 'isSensitive',
    accessor: ({ isSensitive }) => (
      <Caps>
        <NullableBooleanCell value={isSensitive} />
      </Caps>
    ),
  },
  {
    accessor: VisibilityStatusCell,
    key: 'visibilityStatus',
    title: 'visibilityStatus',
  },
  {
    key: 'notifiable',
    title: 'notifiable',
    accessor: ({ notifiable }) => (
      <Caps>
        <NullableBooleanCell value={notifiable} />
      </Caps>
    ),
  },
  {
    accessor: NotifyEmailAddressesCell,
    key: 'notifyEmailAddresses',
    title: 'notifyEmailAddresses',
    sortable: false,
  },
]);

export function ManageProgramSurveysTable(props) {
  const { programId } = useParams();
  const endpoint = programId ? `admin/program/${encodeURIComponent(programId)}/surveys` : '';

  return (
    <StyledDataFetchingTable
      columns={programSurveyColumns}
      endpoint={endpoint}
      initialSort={{ orderBy: 'name', order: 'asc' }}
      noDataMessage={
        <ContentUnavailableView
          heading={
            <TranslatedText
              stringId="admin.programs.surveys.noData.heading"
              fallback="No surveys"
            />
          }
          description={
            <TranslatedText
              stringId="admin.programs.surveys.noData.description"
              fallback="No surveys found for this program"
            />
          }
        />
      }
      data-testid="program-surveys-table"
      {...props}
    />
  );
}
