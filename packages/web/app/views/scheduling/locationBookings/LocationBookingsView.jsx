import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import { omit } from 'lodash';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useLocationsQuery } from '../../../api/queries';
import { Button, PageContainer, TopBar, TranslatedText } from '../../../components';
import { CancelLocationBookingModal } from '../../../components/Appointments/CancelModal/CancelLocationBookingModal';
import { LocationBookingDrawer } from '../../../components/Appointments/LocationBookingForm/LocationBookingDrawer';
import { Colors } from '../../../constants';
import { useAuth } from '../../../contexts/Auth';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CalendarSearchBar } from './CalendarSearchBar';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';
import { appointmentToFormValues } from './utils';

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

  const { filters, setFilters, setSelectedCell } = useLocationBookingsContext();
  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation();

  const handleFilterChange = useCallback(
    values => {
      setFilters(values);
      mutateUserPreferences({ locationBookingFilters: omit(values, ['patientNameOrId']) });
    },
    [setFilters, mutateUserPreferences],
  );

  const closeBookingForm = () => {
    setIsDrawerOpen(false);
  };

  const openBookingForm = async prepopulationValues => {
    await setSelectedAppointment(prepopulationValues);
    setSelectedCell({ locationId: prepopulationValues.locationId, date: prepopulationValues.date });
    setIsDrawerOpen(true);
  };

  const openCancelModal = appointment => {
    setSelectedAppointment(appointmentToFormValues(appointment));
    setIsCancelModalOpen(true);
  };

  const handleNewBooking = async () => {
    await setSelectedAppointment(null);
    openBookingForm({});
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
        <NewBookingButton onClick={handleNewBooking}>
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
      <CancelLocationBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
      {selectedAppointment && (
        <LocationBookingDrawer
          initialValues={selectedAppointment}
          open={isDrawerOpen}
          onClose={closeBookingForm}
        />
      )}
    </Wrapper>
  );
};
