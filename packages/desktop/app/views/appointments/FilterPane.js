import React from 'react';
import styled from 'styled-components';
import { ButtonGroup, Checkbox, FormControlLabel, Typography } from '@material-ui/core';

import { Button, TopBar } from '../../components';
import { Colors } from '../../constants';
import { AppointmentsContext } from './AppointmentsContext';

export const FilterPane = () => {
  const {
    locations,
    filteredLocations,
    isAllLocations,
    onAllLocationsChange,
    onLocationChange,
  } = React.useContext(AppointmentsContext);
  return (
    <Container>
      <TopBar title="Appointments"></TopBar>
      <ViewCalendarBy>
        <Typography variant="subtitle2">View calendar by:</Typography>
        <ButtonGroup>
          <Button color="primary" variant="contained">
            Locations
          </Button>
          <Button disabled>Clinicians</Button>
        </ButtonGroup>
      </ViewCalendarBy>
      <ViewBySelection>
        <Typography variant="subtitle2">Locations</Typography>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={isAllLocations}
              value="all-locations"
              onChange={onAllLocationsChange}
            />
          }
          label="All Locations"
        />
        {locations.map(location => (
          <FormControlLabel
            control={
              <Checkbox
                key={location.id}
                disabled={isAllLocations}
                color="primary"
                checked={!isAllLocations && !!filteredLocations[location.id]}
                value={location.id}
                onChange={e => onLocationChange(e.target.value)}
              />
            }
            label={location.name}
          />
        ))}
      </ViewBySelection>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  border-right: 1px solid ${Colors.outline};
`;

const ViewCalendarBy = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
`;

const ViewBySelection = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: column;
`;
