import { endOfDay, formatISO, isSameDay, parseISO } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../../api/queries';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import {
  appointmentToFormValues,
  partitionAppointmentsByDate,
  partitionAppointmentsByLocation,
} from './utils';

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
        hideTime={!isSameDay(date, parseISO(a.startTime))}
        key={a.id}
        onCancel={() => openCancelModal(a)}
        onEdit={() => openBookingForm(appointmentToFormValues(a))}
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

export const LocationBookingsCalendarBody = ({
  appointmentsByLocation,
  displayedDates,
  filteredLocations,
  locationsQuery,
  openBookingForm,
  openCancelModal,
}) => {
  if (locationsQuery.isLoading) return <SkeletonRows colCount={displayedDates.length} />;

  if (filteredLocations?.length === 0) return null;

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
