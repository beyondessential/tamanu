import { Typography } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import { parseISO } from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';
import { VIEW_TYPES } from '@tamanu/constants';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { useLocationsQuery } from '../../../api/queries';
import { PageContainer, TopBar } from '../../../components';
import { CancelLocationBookingModal } from '../../../components/Appointments/CancelModal/CancelLocationBookingModal';
import { LocationBookingDrawer } from '../../../components/Appointments/LocationBookingForm/LocationBookingDrawer';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { LocationBookingsCalendar } from './LocationBookingsCalendar';
import { LocationBookingsDailyCalendar } from './LocationBookingsDailyCalendar';
import { LocationBookingsFilter } from './LocationBookingsFilter';
import { ViewTypeToggle } from './ViewTypeToggle';
import { appointmentToFormValues } from './utils';
import { NoPermissionScreen } from '../../NoPermissionScreen';
import { DateSelector } from '../outpatientBookings/DateSelector';

export const LOCATION_BOOKINGS_CALENDAR_ID = 'location-bookings-calendar';

const PlusIcon = styled(AddRounded)`
  && {
    margin-inline-end: 0.1875rem;
  }
`;

const LocationBookingsTopBar = styled(TopBar).attrs({
  title: (
    <TranslatedText
      stringId="scheduling.locationBookings.title"
      fallback="Bookings"
      data-testid="translatedtext-y7nl"
    />
  ),
})`
  h3 {
    min-width: auto;
    flex: 0;
  }
  .MuiToolbar-root {
    justify-content: flex-start;
    gap: 1rem;
  }
  border-block-end: max(0.0625rem, 1px) ${Colors.outline} solid;
`;

const Wrapper = styled(PageContainer)`
  display: grid;
  grid-template-rows: auto 1fr auto;
  max-block-size: 100%;
`;

const CalendarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  margin: 1rem;
  border-radius: 0.25rem;
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  background: ${Colors.white};
`;

const CalendarInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
  border-block-start: max(0.0625rem, 1px) solid ${Colors.outline};
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
  const { ability, facilityId } = useAuth();

  const {
    filters,
    updateSelectedCell,
    viewType,
    selectedDate,
    setSelectedDate,
  } = useLocationBookingsContext();
  const closeBookingForm = () => {
    updateSelectedCell({ locationId: null, date: null });
    setIsDrawerOpen(false);
  };

  const openBookingForm = async appointment => {
    // “Useless” await seems to ensure locationGroupId and locationId fields are
    // correctly cleared upon resetForm()
    await setSelectedAppointment(appointment);

    const { locationId, startTime } = appointment;
    if (locationId && startTime) {
      updateSelectedCell({ locationId, date: parseISO(startTime) });
    }
    setIsDrawerOpen(true);
  };

  const openCancelModal = appointment => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  const handleNewBooking = async () => {
    // "Useless" await seems to ensure locationGroupId and locationId fields are
    // correctly cleared upon resetForm()
    await setSelectedAppointment(null);
    openBookingForm({});
  };

  const handleDateChange = event => {
    setSelectedDate(event.target.value);
  };

  const locationsQuery = useLocationsQuery(
    {
      facilityId,
      isBookable: viewType,
      locationGroupIds: filters.locationGroupIds,
    },
    { keepPreviousData: true },
  );

  const { data: locations } = locationsQuery;
  const hasNoLocations = locations?.length === 0;

  const canCreateAppointment = ability.can('create', 'Appointment');
  const canViewAppointments = ability.can('listOrRead', 'Appointment');

  if (!canViewAppointments) {
    return <NoPermissionScreen data-testid="nopermissionscreen-56z7" />;
  }

  return (
    <Wrapper data-testid="wrapper-r1vl">
      <LocationBookingsTopBar data-testid="locationbookingstopbar-0w60">
        <ViewTypeToggle data-testid="viewtypetoggle-main" disabled={isDrawerOpen} />
        <LocationBookingsFilter data-testid="locationbookingsfilter-xdku" />
        {canCreateAppointment && (
          <Button onClick={handleNewBooking} data-testid="newbookingbutton-sl1p">
            <PlusIcon data-testid="plusicon-ufmc" />
            <TranslatedText
              stringId="locationBooking.calendar.bookLocation"
              fallback="Book location"
              data-testid="translatedtext-feur"
            />
          </Button>
        )}
      </LocationBookingsTopBar>
      {hasNoLocations ? (
        <EmptyStateLabel data-testid="emptystatelabel-5iov">
          <TranslatedText
            stringId="locationBooking.calendar.noBookableLocations"
            fallback="No bookable locations"
            data-testid="translatedtext-e6bf"
          />
        </EmptyStateLabel>
      ) : viewType === VIEW_TYPES.DAILY ? (
        <CalendarWrapper data-testid="calendarwrapper-daily">
          <DateSelector
            value={selectedDate}
            onChange={handleDateChange}
            data-testid="dateselector-daily"
          />
          <DndProvider backend={HTML5Backend}>
            <CalendarInnerWrapper data-testid="calendarinnerwrapper-daily">
              <LocationBookingsDailyCalendar
                locationsQuery={locationsQuery}
                selectedDate={selectedDate}
                openBookingForm={openBookingForm}
                openCancelModal={openCancelModal}
                data-testid="locationbookingsdailycalendar-main"
              />
            </CalendarInnerWrapper>
          </DndProvider>
        </CalendarWrapper>
      ) : (
        <LocationBookingsCalendar
          id={LOCATION_BOOKINGS_CALENDAR_ID}
          locationsQuery={locationsQuery}
          openBookingForm={openBookingForm}
          openCancelModal={openCancelModal}
          data-testid="locationbookingscalendar-s3yu"
        />
      )}
      <CancelLocationBookingModal
        appointment={selectedAppointment}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        data-testid="cancellocationbookingmodal-4tih"
      />
      {selectedAppointment && (
        <LocationBookingDrawer
          initialValues={appointmentToFormValues(selectedAppointment)}
          key={
            selectedAppointment.id ??
            `${selectedAppointment.locationId}_${selectedAppointment.startTime}`
          }
          open={isDrawerOpen}
          onClose={closeBookingForm}
          data-testid="locationbookingdrawer-kv0j"
        />
      )}
    </Wrapper>
  );
};
