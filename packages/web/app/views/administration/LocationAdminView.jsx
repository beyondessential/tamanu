import React, { useCallback, useState } from 'react';
import {
  Button,
  DataFetchingTable,
  LocationSearchBar,
  PageContainer,
  TopBar,
} from '../../components';
import { NewLocationForm } from '../../forms';
import { NewRecordModal } from './components';
import { LOCATION_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [
  {
    key: 'name',
    title: 'Name',
    minWidth: 100,
  },
];

const LocationTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint={LOCATION_SEARCH_ENDPOINT}
    columns={COLUMNS}
    noDataMessage="No locations found"
    {...props}
    data-test-id='datafetchingtable-x7n2' />
));

export const LocationAdminView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingLocation, setCreatingLocation] = useState(false);

  const showCreatingLocationModal = useCallback(() => {
    setCreatingLocation(true);
  }, []);

  const hideCreatingLocationModal = useCallback(() => {
    setCreatingLocation(false);
  }, []);

  return (
    <PageContainer>
      <TopBar title="Locations" data-test-id='topbar-a19z'>
        <Button
          color="primary"
          variant="outlined"
          onClick={showCreatingLocationModal}
          data-test-id='button-x7x7'>
          Add new location
        </Button>
      </TopBar>
      <LocationSearchBar onSearch={setSearchParameters} />
      <LocationTable fetchOptions={searchParameters} />
      <NewRecordModal
        title="Create new location"
        endpoint="location"
        open={creatingLocation}
        onCancel={hideCreatingLocationModal}
        Form={NewLocationForm}
      />
    </PageContainer>
  );
});
