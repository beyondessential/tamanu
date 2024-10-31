import React, { useState } from 'react';
import styled from 'styled-components';

import { useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { Typography } from '@material-ui/core';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';
import { BookLocationDrawer } from '../../../components/Appointments/LocationBookingForm/BookLocationDrawer';
import { AddRounded } from '@material-ui/icons';
import { useAuth } from '../../../contexts/Auth';

const PlusIcon = styled(AddRounded)`
  && {
    margin-right: 3px;
  }
`;

// BEGIN PLACEHOLDERS

const Placeholder = styled.div`
  background-color: oklch(0% 0 0 / 3%);
  max-block-size: 100%;
  border: 1px solid oklch(0% 0 0 / 15%);
  border-radius: 0.2rem;
  color: oklch(0% 0 0 / 55%);
  display: grid;
  font-size: 1rem;
  padding: 0.5rem;
  place-items: center;
  text-align: center;
`;

// END PLACEHOLDERS

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})``;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr;
  max-block-size: 100%;
`;

const Filters = styled('search')`
  display: flex;
  gap: 1rem;
`;

const NewBookingButton = styled(Button)`
  margin-inline-start: 1rem;
`;

const EmptyStateLabel = styled(Typography).attrs({
  align: 'center',
  color: 'textSecondary',
  variant: 'body1',
})`
  color: ${Colors.midText};
  font-size: 2rem;
  font-weight: 400;
  place-self: center;

  ${Wrapper}:has(&) {
    min-block-size: 100%;
  }
`;

export const LocationBookingsView = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialDrawerValues, setInitialDrawerValues] = useState({});
  const { facilityId } = useAuth()
  const closeBookingForm = () => {
    setIsDrawerOpen(false);
  };
  const openBookingForm = initialValues => {
    setInitialDrawerValues(initialValues);
    setIsDrawerOpen(true); 
  };

  const locationsQuery = useLocationsQuery({
    facilityId,
    bookableOnly: true,
  });
  const { data: locations } = locationsQuery;
  const hasNoLocations = locations?.length === 0;

  return (
    <Wrapper>
      <LocationBookingsTopBar>
        <Filters>
          <Placeholder>Search</Placeholder>
          <Placeholder>Area</Placeholder>
          <Placeholder>Clinician</Placeholder>
          <Placeholder>Type</Placeholder>
        </Filters>
        <NewBookingButton onClick={() => openBookingForm({})}>
          <PlusIcon />
          <TranslatedText stringId="locationBooking.calendar.newBooking" fallback="New booking" />
        </NewBookingButton>
      </LocationBookingsTopBar>
      {hasNoLocations ? (
        <EmptyStateLabel>
          <TranslatedText
            stringId="locationBooking.calendar.noBookableLocations"
            fallback="No bookable locations"
          />
        </EmptyStateLabel>
      ) : (
        <LocationBookingsCalendar
          locationsQuery={locationsQuery}
          openBookingForm={openBookingForm}
        />
      )}
      <BookLocationDrawer
        initialBookingValues={initialDrawerValues}
        open={isDrawerOpen}
        closeDrawer={closeBookingForm}
      />
    </Wrapper>
  );
};
