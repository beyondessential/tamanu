import React, { useState, useCallback } from 'react';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { NewUserForm } from '../../forms';
import { NewRecordModal } from './components';
import { USER_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [
  {
    key: 'displayName',
    title: 'Name',
    minWidth: 100,
  },
  {
    key: 'email',
    title: 'Email address',
    minWidth: 100,
  },
  {
    key: 'role',
    title: 'Role',
    minWidth: 100,
  },
];

const UserTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint={USER_SEARCH_ENDPOINT}
    columns={COLUMNS}
    noDataMessage="No users found"
    {...props}
  />
));

export const UserAdminView = React.memo(() => {
  const [creatingUser, setCreatingUser] = useState(false);

  const showCreatingUserModal = useCallback(() => {
    setCreatingUser(true);
  }, []);

  const hideCreatingUserModal = useCallback(() => {
    setCreatingUser(false);
  }, []);

  return (
    <PageContainer>
      <TopBar title="Users">
        <Button color="primary" variant="outlined" onClick={showCreatingUserModal}>
          Add new user
        </Button>
      </TopBar>
      <UserTable fetchOptions={{}} />
      <NewRecordModal
        title="Create new user"
        endpoint="user"
        open={creatingUser}
        onCancel={hideCreatingUserModal}
        Form={NewUserForm}
      />
    </PageContainer>
  );
});
