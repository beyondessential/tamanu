import React, { useState } from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Box } from '@material-ui/core';
import {
  Button,
  DataFetchingTable,
  Heading1,
  TranslatedText,
  UserSearchBar,
} from '../../../components';
import { USERS_ENDPOINT } from '../constants';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { LimitedLinesCell } from '../../../components/FormattedTableCell';
import { UserProfileModal } from './UserProfileModal';
import { useAuth } from '../../../contexts/Auth';
import { Divider } from '@mui/material';
import { AddUserModal } from './AddUserModal';
import { PlusIcon } from '../../../assets/icons/PlusIcon';

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

const TableHeaderActions = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 7px;
`;

const AddUserButton = styled(Button)`
  background-color: ${Colors.primary};
  color: ${Colors.white};
  font-size: 14px;
  padding: 8px 16px;
  min-width: auto;
  width: 124px;
  height: 44px;

  svg {
    margin-right: 10px;
    width: 18px;
    height: 18px;
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
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const { ability } = useAuth();
  const hasPermission = ability.can('list', 'User');
  const canCreateUser = ability.can('create', 'User');

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

  const handleAddUserClick = () => {
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const title = <TranslatedText stringId="adminSidebar.users" fallback="Users" />;

  const titleActions = canCreateUser && (
    <AddUserButton onClick={handleAddUserClick} data-testid="add-user-button">
      <PlusIcon fill={Colors.white} className="plus-icon" />
      <TranslatedText stringId="admin.users.addUser.button" fallback="Add user" />
    </AddUserButton>
  );

  if (!hasPermission) {
    return (
      <AdminViewContainer title={title}>
        <Divider sx={{ borderColor: Colors.outline }} />
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
    <AdminViewContainer title={title} titleActions={titleActions}>
      <TableContainer>
        <TableHeaderActions>
          <UserSearchTitle>
            <TranslatedText stringId="admin.users.search.title" fallback="User search" />
          </UserSearchTitle>
        </TableHeaderActions>
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

      {isAddUserModalOpen && (
        <AddUserModal open onClose={handleCloseAddUserModal} handleRefresh={handleRefresh} />
      )}
    </AdminViewContainer>
  );
});
