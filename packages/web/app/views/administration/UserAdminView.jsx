import React from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Box, Divider } from '@material-ui/core';
import { DataFetchingTable, Heading1, TranslatedText } from '../../components';
import { USERS_ENDPOINT } from './constants';
import { Colors } from '../../constants';
import { ThemedTooltip } from '../../components/Tooltip';
import { AdminViewContainer } from './components/AdminViewContainer';
import { LimitedLinesCell } from '../../components/FormattedTableCell';
import { useAuth } from '../../contexts/Auth';

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

const PermissionDeniedView = styled.div`
  margin: 20px 20px 34px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
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
  <DataFetchingTable
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
  const { ability } = useAuth();
  const hasPermission = ability.can('list', 'User');

  const title = <TranslatedText stringId="adminSidebar.users" fallback="Users" />;

  if (!hasPermission) {
    return (
      <AdminViewContainer title={title}>
        <Divider color={Colors.outline} />
        <PermissionDeniedView>
          <Heading1 m={0}>
            <TranslatedText
              stringId="admin.users.noPermission.title"
              fallback="Permission required"
            />
          </Heading1>
          <span>
            <TranslatedText
              stringId="admin.users.noPermission.subtitle"
              fallback="You do not have permission to use this feature"
            />
          </span>
          <span fontSize="16px">
            <TranslatedText
              stringId="admin.users.noPermission.description"
              fallback="Please speak to your System Administrator if you think this is incorrect."
            />
          </span>
        </PermissionDeniedView>
      </AdminViewContainer>
    );
  }

  return (
    <AdminViewContainer title={title}>
      <TableContainer>
        <UserTable fetchOptions={{}} data-testid="usertable-mpss" />
      </TableContainer>
    </AdminViewContainer>
  );
});
