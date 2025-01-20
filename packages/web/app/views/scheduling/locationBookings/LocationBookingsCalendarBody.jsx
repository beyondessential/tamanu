import { formatISO, isEqual, isSameDay, parseISO } from 'date-fns';
import React from 'react';

import { toDateString } from '@tamanu/utils/dateTime';

import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import { generateIdFromCell, partitionAppointmentsByDate } from './utils';
import { useAuth } from '../../../contexts/Auth';

export const BookingsCell = ({
  appointments,
  date,
  location: { id: locationId },
  openBookingForm,
  openCancelModal,
}) => {
  const { ability } = useAuth();
  const { selectedCell, updateSelectedCell } = useLocationBookingsContext();
  const isSelected = selectedCell.locationId === locationId && isEqual(date, selectedCell.date);

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={e => {
        const canCreateBooking = ability.can('create', 'Appointment');
        if (e.target.closest('.appointment-tile') || !canCreateBooking) return;
        openBookingForm({ startDate: toDateString(date), locationId });
        updateSelectedCell({ date, locationId });
      }}
      $selected={isSelected}
    >
      {appointments?.map(a => (
        <AppointmentTile
          appointment={a}
          className="appointment-tile"
          hideTime={!isSameDay(date, parseISO(a.startTime))}
          key={a.id}
          onCancel={() => openCancelModal(a)}
          onEdit={() => openBookingForm(a)}
        />
      ))}
    </CarouselGrid.Cell>
  );
};

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
