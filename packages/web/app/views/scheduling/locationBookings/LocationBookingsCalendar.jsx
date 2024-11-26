import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../../api/queries';
import { APPOINTMENT_CALENDAR_CLASS } from '../../../components';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { LocationBookingsCalendarBody } from './LocationBookingsCalendarBody';
import { LocationBookingsCalendarHeader } from './LocationBookingsCalendarHeader';
import { partitionAppointmentsByLocation } from './utils';

const getDisplayableDates = date => {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

const Carousel = styled.div`
  background-color: ${Colors.white};
  border: max(0.0625rem, 1px) solid ${Colors.outline};
  border-radius: 0.2rem;
  display: grid;
  grid-template-rows: 1fr auto;
  margin: 1rem;
  max-block-size: 100%;
  overflow: scroll;
  overscroll-behavior: contain;
  // Uncomment line below to re-enable scroll snap. Components in CarouselComponents still support
  // scroll snap, but disabling because Chrome’s current handling of scrolling by clicking-and-
  // holding scrollbar arrows doesn’t respect the final scroll offset. It jumps back to the original
  // scroll offset.
  // scroll-snap-type: both mandatory;

  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

const EmptyState = styled.div`
  color: ${Colors.primary};
  font-weight: 500;
  margin-block: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  margin-inline: 1rem;
`;

const emptyStateMessage = (
  <EmptyState>No bookings to display. Please try adjusting the search filters.</EmptyState>
);

export const LocationBookingsCalendar = ({ locationsQuery, openBookingForm, openCancelModal }) => {
  const selectedMonthState = useState(startOfToday());
  const [monthOf] = selectedMonthState;
  const displayedDates = getDisplayableDates(monthOf);

  const {
    filters: { bookingTypeId, clinicianId, patientNameOrId },
  } = useLocationBookingsContext();
  // When filtering only by location, don’t hide locations that contain no appointments
  const areNonLocationFiltersActive =
    clinicianId?.length > 0 || bookingTypeId?.length > 0 || !!patientNameOrId;
  const { data: locations } = locationsQuery;

  const { data: appointmentsData } = useAppointmentsQuery({
    after: displayedDates[0],
    before: endOfDay(displayedDates.at(-1)),
    all: true,
    locationId: '',
    clinicianId,
    bookingTypeId,
    patientNameOrId,
  });
  const appointments = appointmentsData?.data ?? [];
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  const filteredLocations = areNonLocationFiltersActive
    ? locations?.filter(location => appointmentsByLocation[location.id])
    : locations;

  return (
    <>
      <Carousel className={APPOINTMENT_CALENDAR_CLASS}>
        <CarouselGrid.Root $dayCount={displayedDates.length}>
          <LocationBookingsCalendarHeader
            selectedMonthState={selectedMonthState}
            displayedDates={displayedDates}
          />
          <LocationBookingsCalendarBody
            appointmentsByLocation={appointmentsByLocation}
            displayedDates={displayedDates}
            filteredLocations={filteredLocations}
            locationsQuery={locationsQuery}
            openBookingForm={openBookingForm}
            openCancelModal={openCancelModal}
          />
        </CarouselGrid.Root>
      </Carousel>
      {filteredLocations?.length === 0 && emptyStateMessage}
    </>
  );
};
