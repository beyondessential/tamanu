import { endOfDay, formatISO } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../../api/queries';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import { partitionAppointmentsByDate, partitionAppointmentsByLocation } from './util';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

export const BookingsCell = ({
  appointments,
  date,
  location,
  openBookingForm,
  openCancelModal,
}) => (
  <CarouselGrid.Cell
    onClick={e => {
      if (e.target.closest('.appointment-tile')) return;
      // Open form for creating new booking
      openBookingForm({ date: toDateTimeString(date), locationId: location.id });
    }}
  >
    {appointments?.map(a => (
      <AppointmentTile
        className="appointment-tile"
        onEdit={() => openBookingForm({ ...a, date: a.startTime })}
        onCancel={() => openCancelModal(a)}
        appointment={a}
        key={a.id}
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
  const { data: locations, isLoading: locationsAreLoading } = locationsQuery;
  const appointments =
    useAppointmentsQuery({
      after: displayedDates[0],
      before: endOfDay(displayedDates[displayedDates.length - 1]),
      locationId: '',
      all: true,
    }).data?.data ?? [];

  if (locationsAreLoading) return <SkeletonRows colCount={displayedDates.length} />;
  if (locations?.length === 0) return <EmptyStateRow />;

  const appointmentsByLocation = partitionAppointmentsByLocation(appointments);

  return locations?.map(location => (
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
