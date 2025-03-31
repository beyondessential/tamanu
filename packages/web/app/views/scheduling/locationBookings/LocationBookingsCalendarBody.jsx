import { formatISO, isEqual, isSameDay, parseISO } from 'date-fns';
import React from 'react';

import { toDateString } from '@tamanu/utils/dateTime';

import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { SkeletonRows } from './Skeletons';
import { generateIdFromCell, partitionAppointmentsByDate } from './utils';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedReferenceData } from '../../../components';

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
  const canCreateBooking = ability.can('create', 'Appointment');

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={e => {
        if (e.target.closest('.appointment-tile') || !canCreateBooking) return;
        openBookingForm({ startDate: toDateString(date), locationId });
        updateSelectedCell({ date, locationId });
      }}
      $selected={isSelected}
      $clickable={canCreateBooking}
      data-testid='cell-dp5l'>
      {appointments?.map(a => (
        <AppointmentTile
          appointment={a}
          className="appointment-tile"
          hideTime={!isSameDay(date, parseISO(a.startTime))}
          key={a.id}
          onCancel={() => openCancelModal(a)}
          onEdit={() => openBookingForm(a)}
          data-testid='appointmenttile-b6vn' />
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
  const { locationGroup } = location;
  const appointmentsByDate = partitionAppointmentsByDate(appointments);

  return (
    <CarouselGrid.Row data-testid='row-m8yc'>
      <CarouselGrid.RowHeaderCell data-testid='rowheadercell-qiko'>
        <TranslatedReferenceData
          category="locationGroup"
          value={locationGroup.id}
          fallback={locationGroup.name}
          data-testid='translatedreferencedata-7cuw' />{' '}
        <TranslatedReferenceData
          category="location"
          value={location.id}
          fallback={location.name}
          data-testid='translatedreferencedata-1gpj' />
      </CarouselGrid.RowHeaderCell>
      {dates.map(d => (
        <BookingsCell
          appointments={appointmentsByDate[formatISO(d, { representation: 'date' })]}
          date={d}
          key={d.valueOf()}
          location={location}
          openBookingForm={openBookingForm}
          openCancelModal={openCancelModal}
          data-testid='bookingscell-5t8x' />
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
  if (locationsQuery.isLoading) return <SkeletonRows colCount={displayedDates.length} data-testid='skeletonrows-munx' />;

  if (filteredLocations?.length === 0) return null;

  return filteredLocations?.map(location => (
    <BookingsRow
      appointments={appointmentsByLocation[location.id] ?? []}
      dates={displayedDates}
      key={location.code}
      location={location}
      openBookingForm={openBookingForm}
      openCancelModal={openCancelModal}
      data-testid='bookingsrow-t3ka' />
  ));
};
