import React, { useState } from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Box } from '@material-ui/core';
import { DataFetchingTable, TranslatedText, UserSearchBar } from '../../components';
import { USERS_ENDPOINT } from './constants';
import { Colors } from '../../constants';
import { ThemedTooltip } from '../../components/Tooltip';
import { AdminViewContainer } from './components/AdminViewContainer';
import { LimitedLinesCell } from '../../components/FormattedTableCell';

const StatusDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StatusActiveDot = styled.div`
  background-color: ${Colors.safe};
  height: 7px;
  width: 7px;
  border-radius: 10px;
`;

const StatusInactiveDot = styled(StatusActiveDot)`
  background-color: ${Colors.softText};
`;

const TableContainer = styled.div`
  padding: 24px 30px;
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  box-shadow: none;
`;

const UserStatusIndicator = ({ visibilityStatus }) => {
  const isActive = visibilityStatus === VISIBILITY_STATUSES.CURRENT;
  const tooltipText = isActive ? (
    <TranslatedText stringId="admin.users.active.tooltip" fallback="Active" />
  ) : (
    <TranslatedText stringId="admin.users.inactive.tooltip" fallback="Deactivated" />
  );

  return (
    <ThemedTooltip title={tooltipText}>
      <StatusDiv>
        {isActive ? (
          <StatusActiveDot data-testid="statusactivedot-user" />
        ) : (
          <StatusInactiveDot data-testid="statusinactivedot-user" />
        )}
      </StatusDiv>
    </ThemedTooltip>
  );
};

// Helper function to display empty fields as hyphen
const displayFieldOrHyphen = value => value || '-';

const COLUMNS = [
  {
    key: '',
    sortable: false,
    accessor: ({ visibilityStatus }) => <UserStatusIndicator visibilityStatus={visibilityStatus} />,
  },
  {
    key: 'displayName',
    title: <TranslatedText stringId="admin.users.displayName.column" fallback="Display name" />,
    sortable: true,
  },
  {
    key: 'displayId',
    title: <TranslatedText stringId="admin.users.displayId.column" fallback="ID" />,
    sortable: false,
    accessor: ({ displayId }) => <Box minWidth="60px">{displayFieldOrHyphen(displayId)}</Box>,
  },
  {
    key: 'roleName',
    title: <TranslatedText stringId="admin.users.role.column" fallback="Role" />,
    sortable: true,
    accessor: ({ roleName }) => displayFieldOrHyphen(roleName),
  },
  {
    key: 'designations',
    title: <TranslatedText stringId="admin.users.designation.column" fallback="Designation" />,
    sortable: true,
    accessor: ({ designations }) =>
      displayFieldOrHyphen(designations?.length > 0 ? designations.join(', ') : null),
    CellComponent: props => <LimitedLinesCell {...props} isOneLine maxWidth="150px" />,
  },
  {
    key: 'email',
    title: <TranslatedText stringId="admin.users.email.column" fallback="Email" />,
    sortable: true,
    accessor: ({ email }) => displayFieldOrHyphen(email),
  },
  {
    key: 'phoneNumber',
    title: <TranslatedText stringId="admin.users.phoneNumber.column" fallback="Phone" />,
    sortable: true,
    accessor: ({ phoneNumber }) => displayFieldOrHyphen(phoneNumber),
  },
];

const UserTable = React.memo(({ ...props }) => (
  <StyledDataFetchingTable
    endpoint={USERS_ENDPOINT}
    columns={COLUMNS}
    noDataMessage={
      <TranslatedText stringId="admin.users.noData.message" fallback="No users found" />
    }
    defaultRowsPerPage={10}
    initialSort={{ orderBy: 'displayName', order: 'asc' }}
    {...props}
    data-testid="datafetchingtable-3ziq"
  />
));

export const UserAdminView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <AdminViewContainer title={<TranslatedText stringId="adminSidebar.users" fallback="Users" />}>
      <TableContainer>
        <UserSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          data-testid="usersearchbar-admin"
        />
        <UserTable fetchOptions={searchParameters} data-testid="usertable-mpss" />
      </TableContainer>
    </AdminViewContainer>
  );
});
