import { endOfDay, formatISO } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../../api/queries';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import {
  appointmentToFormFields,
  partitionAppointmentsByDate,
  partitionAppointmentsByLocation,
} from './util';

export const BookingsCell = ({
  appointments,
  date,
  location: { id: locationId },
  openBookingForm,
  openCancelModal,
}) => (
  <CarouselGrid.Cell
    onClick={e => {
      if (e.target.closest('.appointment-tile')) return;
      // Open form for creating new booking
      openBookingForm({ date, startDate: date, locationId });
    }}
  >
    {appointments?.map(a => (
      <AppointmentTile
        appointment={a}
        className="appointment-tile"
        key={a.id}
        onCancel={() => openCancelModal(a)}
        onEdit={() => openBookingForm(appointmentToFormFields(a))}
      />
    ))}
  </CarouselGrid.Cell>
);

export const BookingsRow = ({
  appointments,
  dates,
  location,
  openBookingForm,
  openCancelModal,
}) => {
  const {
    name: locationName,
    locationGroup: { name: locationGroupName },
  } = location;
  const appointmentsByDate = partitionAppointmentsByDate(appointments);

  return (
    <CarouselGrid.Row>
      <CarouselGrid.RowHeaderCell>
        {locationGroupName} {locationName}
      </CarouselGrid.RowHeaderCell>
      {dates.map(d => (
        <BookingsCell
          appointments={appointmentsByDate[formatISO(d, { representation: 'date' })]}
          date={d}
          key={d.valueOf()}
          location={location}
          openBookingForm={openBookingForm}
          openCancelModal={openCancelModal}
        />
      ))}
    </CarouselGrid.Row>
  );
};

const StyledRow = styled(CarouselGrid.Row)`
  color: ${Colors.primary};
  font-weight: 500;
  grid-template-columns: initial;
  place-items: center;
  margin-block: 0.5rem;
`;

const EmptyStateRow = () => (
  <StyledRow>No bookings to display. Please try adjusting the search filters.</StyledRow>
);

export const LocationBookingsCalendarBody = ({
  displayedDates,
  locationsQuery,
  openBookingForm,
  openCancelModal,
}) => {
  const { data: locations = [], isLoading: locationsAreLoading } = locationsQuery;

  const { filters } = useLocationBookingsContext();

  const { data: appointmentsData = [] } = useAppointmentsQuery({
    after: displayedDates[0],
    before: endOfDay(displayedDates[displayedDates.length - 1]),
    all: true,
    locationId: '',
    clinicianId: filters.clinicianId,
    bookingTypeId: filters.bookingTypeId,
    patientNameOrId: filters.patientNameOrId,
  });

  if (locationsAreLoading) return <SkeletonRows colCount={displayedDates.length} />;
  if (locations.length === 0) return <EmptyStateRow />;

  const appointments = appointmentsData.data ?? [];
  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  const areFiltersActive = Object.values(filters).some(
    filter => filter !== null && filter.length > 0,
  );

  const filteredLocations = areFiltersActive
    ? locations.filter(location => appointmentsByLocation[location.id])
    : locations;

  if (filteredLocations.length === 0) return <EmptyStateRow />;

  return filteredLocations?.map(location => (
    <BookingsRow
      appointments={appointmentsByLocation[location.id] ?? []}
      dates={displayedDates}
      key={location.code}
      location={location}
      openBookingForm={openBookingForm}
      openCancelModal={openCancelModal}
    />
  ));
};
