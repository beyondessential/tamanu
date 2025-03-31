import React, { useCallback, useState } from 'react';
import { Button, DataFetchingTable, PageContainer, TopBar } from '../../components';
import { NewUserForm } from '../../forms';
import { NewRecordModal } from './components';
import { USERS_ENDPOINT } from './constants';

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
    key: 'phoneNumber',
    title: 'Phone number',
    minWidth: 100,
  },
  {
    key: 'role',
    title: 'Role',
    minWidth: 100,
  },
  {
    key: 'allowedFacilities',
    title: 'Facilities',
    minWidth: 100,
    sortable: false,
    accessor: ({ allowedFacilities }) =>
      allowedFacilities === 'ALL' ? 'All facilities' : allowedFacilities.length ? allowedFacilities.join(', ') : 'None',
  },
];

const UserTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint={USERS_ENDPOINT}
    columns={COLUMNS}
    noDataMessage="No users found"
    {...props}
    data-test-id='datafetchingtable-zi87' />
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
      <TopBar title="Users" data-test-id='topbar-qw01'>
        <Button
          color="primary"
          variant="outlined"
          onClick={showCreatingUserModal}
          data-test-id='button-5bf3'>
          Add new user
        </Button>
      </TopBar>
      <UserTable fetchOptions={{}} />
      <NewRecordModal
        title="Create new user"
        endpoint={USERS_ENDPOINT}
        open={creatingUser}
        onCancel={hideCreatingUserModal}
        Form={NewUserForm}
      />
    </PageContainer>
  );
});
