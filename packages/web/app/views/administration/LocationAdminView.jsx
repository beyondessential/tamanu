import React, { useCallback, useState } from 'react';
import { Button } from '@tamanu/ui-components';
import {
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
    data-testid="datafetchingtable-xc1i"
  />
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
    <PageContainer data-testid="pagecontainer-gm65">
      <TopBar title="Locations" data-testid="topbar-har7">
        <Button
          color="primary"
          variant="outlined"
          onClick={showCreatingLocationModal}
          data-testid="button-0aez"
        >
          Add new location
        </Button>
      </TopBar>
      <LocationSearchBar onSearch={setSearchParameters} data-testid="locationsearchbar-zu6f" />
      <LocationTable fetchOptions={searchParameters} data-testid="locationtable-chkw" />
      <NewRecordModal
        title="Create new location"
        endpoint="location"
        open={creatingLocation}
        onCancel={hideCreatingLocationModal}
        Form={NewLocationForm}
        data-testid="newrecordmodal-qsqh"
      />
    </PageContainer>
  );
});
