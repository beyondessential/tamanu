import React, { useState } from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Box } from '@material-ui/core';
import { DataFetchingTable, TranslatedText, UserSearchBar } from '../../../components';
import { USERS_ENDPOINT } from '../constants';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { LimitedLinesCell } from '../../../components/FormattedTableCell';
import { UserProfileModal } from './UserProfileModal';

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

const UserSearchTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 7px;
  color: ${Colors.darkestText};
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  box-shadow: none;
  .MuiTableBody-root .MuiTableRow-root {
    cursor: pointer;
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
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
      displayFieldOrHyphen(
        designations?.length > 0 ? designations.map(d => d.referenceData?.name).join(', ') : null,
      ),
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

export const UserAdminView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRowClick = user => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <AdminViewContainer title={<TranslatedText stringId="adminSidebar.users" fallback="Users" />}>
      <TableContainer>
        <UserSearchTitle>
          <TranslatedText stringId="admin.users.search.title" fallback="User search" />
        </UserSearchTitle>
        <UserSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          data-testid="usersearchbar-admin"
        />
        <StyledDataFetchingTable
          endpoint={USERS_ENDPOINT}
          columns={COLUMNS}
          noDataMessage={
            <TranslatedText stringId="admin.users.noData.message" fallback="No users found" />
          }
          defaultRowsPerPage={10}
          initialSort={{ orderBy: 'displayName', order: 'asc' }}
          fetchOptions={searchParameters}
          onRowClick={handleRowClick}
          data-testid="usertable-mpss"
          refreshCount={refreshCount}
          allowExport={false}
        />
      </TableContainer>

      {isModalOpen && (
        <UserProfileModal
          open
          onClose={handleCloseModal}
          handleRefresh={handleRefresh}
          user={selectedUser}
        />
      )}
    </AdminViewContainer>
  );
});
