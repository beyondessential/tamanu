import React, { useState, useCallback } from 'react';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { NewUserForm } from '../../forms';
import { SearchBar, NewRecordModal } from './components';
import { USER_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [
  {
    key: 'name',
    title: 'Name',
    minWidth: 100,
  },
  {
    key: 'displayName',
    title: 'Display name',
    minWidth: 100,
  },
  {
    key: 'email',
    title: 'Email address',
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
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingUser, setCreatingUser] = useState(false);

  const toggleCreatingUser = useCallback(() => {
    setCreatingUser(!creatingUser);
  }, [creatingUser]);

  return (
    <PageContainer>
      <TopBar title="Users">
        <Button color="primary" variant="outlined" onClick={toggleCreatingUser}>
          Add new user
        </Button>
      </TopBar>
      <SearchBar onSearch={setSearchParameters} />
      <UserTable fetchOptions={searchParameters} />
      <NewRecordModal
        title="Create new user"
        endpoint="user"
        open={creatingUser}
        onCancel={toggleCreatingUser}
        Form={NewUserForm}
      />
    </PageContainer>
  );
});
