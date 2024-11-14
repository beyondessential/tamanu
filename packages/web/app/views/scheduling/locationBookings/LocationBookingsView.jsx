import React, { useCallback, useState } from 'react';
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
import { useLocationBooking } from '../../../contexts/LocationBooking';
import { CancelBookingModal } from '../../../components/Appointments/CancelBookingModal';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';

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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation();
  const { filters, setFilters } = useLocationBooking();

  const handleFilterChange = useCallback(
    values => {
      setFilters(values);
      // eslint-disable-next-line no-unused-vars
      const { patientNameOrId, ...locationBookingFilters } = values;
      mutateUserPreferences({ locationBookingFilters });
    },
    [setFilters, mutateUserPreferences],
  );

  const closeBookingForm = () => {
    setIsDrawerOpen(false);
  };

  const openBookingForm = initialValues => {
    setSelectedAppointment(initialValues);
    setIsDrawerOpen(true);
  };

  const openCancelModal = appointment => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
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
        <CalendarSearchBar initialFilters={filters} onFilterChange={handleFilterChange} />
        <NewBookingButton onClick={() => openBookingForm({})}>
          <PlusIcon />
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
          openCancelModal={openCancelModal}
        />
      )}
      <BookLocationDrawer
        initialValues={selectedAppointment}
        open={isDrawerOpen}
        onClose={closeBookingForm}
      />
      <CancelBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </Wrapper>
  );
};
