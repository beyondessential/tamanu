import React, { useState, useCallback } from 'react';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { NewLocationForm } from '../../forms';
import { SearchBar, NewRecordModal } from './components';
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
  />
));

export const LocationAdminView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingLocation, setCreatingLocation] = useState(false);

  const toggleCreatingLocation = useCallback(() => {
    setCreatingLocation(!creatingLocation);
  }, [creatingLocation]);

  return (
    <PageContainer>
      <TopBar title="Locations">
        <Button color="primary" variant="outlined" onClick={toggleCreatingLocation}>
          Add new location
        </Button>
      </TopBar>
      <SearchBar onSearch={setSearchParameters} />
      <LocationTable fetchOptions={searchParameters} />
      <NewRecordModal
        title="Create new location"
        endpoint="location"
        open={creatingLocation}
        onCancel={toggleCreatingLocation}
        Form={NewLocationForm}
      />
    </PageContainer>
  );
});
