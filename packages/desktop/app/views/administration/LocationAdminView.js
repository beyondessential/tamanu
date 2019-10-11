import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { NewLocationForm } from '../../forms';
import { SearchBar, NewRecordModal, SeedRecordsModal } from './components';
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

const ButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 15px;
`;

export const LocationAdminView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [seedingLocations, setSeedingLocations] = useState(false);

  const toggleCreatingLocation = useCallback(() => {
    setCreatingLocation(!creatingLocation);
  }, [creatingLocation]);

  const toggleSeedingLocations = useCallback(() => {
    setSeedingLocations(!seedingLocations);
  }, [seedingLocations]);

  return (
    <PageContainer>
      <TopBar title="Locations">
        <ButtonContainer>
          <Button color="secondary" variant="outlined" onClick={toggleSeedingLocations}>
            Add demo locations
          </Button>
          <Button color="primary" variant="outlined" onClick={toggleCreatingLocation}>
            Add new location
          </Button>
        </ButtonContainer>
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
      <SeedRecordsModal
        endpoint="location"
        open={seedingLocations}
        onCancel={toggleSeedingLocations}
      />
    </PageContainer>
  );
});
