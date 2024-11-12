import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import { isSameDay, isValid, startOfDay } from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useLocationsQuery } from '../../../api/queries';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { CancelBookingModal } from '../../../components/Appointments/CancelBookingModal';
import { LocationBookingDrawer } from '../../../components/Appointments/LocationBookingForm/LocationBookingDrawer';
import { Colors } from '../../../constants';
import { useAuth } from '../../../contexts/Auth';
import { useLocationBooking } from '../../../contexts/LocationBooking';
import { CalendarSearchBar } from './CalendarSearchBar';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';

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

const appointmentToFormFields = appointment => {
  if (!appointment) return {};

  const { bookingTypeId, clinicianId, id, locationId, patientId } = appointment;
  const startTime = appointment.startTime ? new Date(appointment.startTime) : null;
  const endTime = appointment.endTime ? new Date(appointment.endTime) : null;

  const startIsValidDate = isValid(startTime);
  const endIsValidDate = isValid(endTime);

  const startDate = startIsValidDate ? startOfDay(startTime) : null;
  const endDate = endIsValidDate ? startOfDay(endTime) : null;
  const overnight = endIsValidDate && !isSameDay(startDate, endDate);

  return {
    // Semantically significant values
    locationId,
    patientId,
    startTime,
    endTime,
    bookingTypeId,
    clinicianId,

    // Only for user input purposes
    overnight,
    date: startDate,
    startDate,
    endDate,

    // Determines whether location booking drawer should open in CREATE or EDIT mode
    id,
  };
};

export const LocationBookingsView = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState({});
  const { facilityId } = useAuth();

  const { filters, handleFilterChange } = useLocationBooking();

  const closeBookingForm = () => {
    setIsDrawerOpen(false);
  };

  const openBookingForm = appointment => {
    setSelectedAppointment(appointmentToFormFields(appointment));
    setIsDrawerOpen(true);
  };

  const openCancelModal = appointment => {
    setSelectedAppointment(appointmentToFormFields(appointment));
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
        <CalendarSearchBar onFilterChange={handleFilterChange} />
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
      <LocationBookingDrawer
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
