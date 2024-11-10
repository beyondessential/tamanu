import React, { useState } from 'react';
import styled from 'styled-components';

import { useLocationsQuery } from '../../../api/queries';
import { Colors } from '../../../constants';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { Typography } from '@material-ui/core';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';
import { CalendarSearchBar } from './CalendarSearchBar';
import { BookLocationDrawer } from '../../../components/Appointments/LocationBookingForm/BookLocationDrawer';
import { AddRounded } from '@material-ui/icons';
import { useAuth } from '../../../contexts/Auth';
import { useLocationBookingFilters } from '../../../contexts/LocationBookingFilters';

const PlusIcon = styled(AddRounded)`
  && {
    margin-inline-end: 0.1875rem;
  }
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText stringId="scheduling.locationBookings.title" fallback="Location bookings" />
  ),
})`
  border-block-end: max(0.0625rem, 1px) ${Colors.outline} solid;
`;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr;
  max-block-size: 100%;
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
  const { facilityId } = useAuth();

  const { filters, handleFilterChange } = useLocationBookingFilters();

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
    locationGroupIds: filters.locationGroupIds,
  });

  const { data: locations } = locationsQuery;
  const hasNoLocations = locations?.length === 0;

  return (
    <Wrapper>
      <LocationBookingsTopBar>
        <CalendarSearchBar onFilterChange={handleFilterChange} />
        <NewBookingButton onClick={() => openBookingForm({})}>
          <PlusIcon />
          <TranslatedText
            stringId="locationBooking.calendar.bookLocation"
            fallback="Book location"
          />
          <TranslatedText
            stringId="locationBooking.calendar.bookLocation"
            fallback="Book location"
          />
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
