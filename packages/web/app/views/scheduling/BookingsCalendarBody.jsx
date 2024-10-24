import { endOfDay, formatISO } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { useAppointmentsQuery } from '../../api/queries';
import { AppointmentTile } from '../../components/Appointments/AppointmentTile';
import { Colors } from '../../constants';
import { CarouselComponents as CarouselGrid } from './locationBookings/CarouselComponents';
import { SkeletonRows } from './locationBookings/Skeletons';
import { partitionAppointmentsByDate, partitionAppointmentsByKey } from './locationBookings/util';

export const BookingsCell = ({ appointments, date, location, openBookingForm }) => (
  <CarouselGrid.Cell
    onClick={() => {
      // Open form for creating new booking
      // openBookingForm({ date, locationId: location.id });
    }}
  >
    {appointments?.map(a => (
      <AppointmentTile appointment={a} key={a.id} />
    ))}
  </CarouselGrid.Cell>
);

export const BookingsRow = ({ appointments, dates, entity, openBookingForm, getHeaderText }) => {
  const appointmentsByDate = partitionAppointmentsByDate(appointments);

  return (
    <CarouselGrid.Row>
      <CarouselGrid.RowHeaderCell>{getHeaderText(entity)}</CarouselGrid.RowHeaderCell>
      {dates.map(d => (
        <BookingsCell
          appointments={appointmentsByDate[formatISO(d, { representation: 'date' })]}
          date={d}
          key={d.valueOf()}
          entity={entity}
          openBookingForm={openBookingForm}
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

export const BookingsCalendarBody = ({
  displayedDates,
  query,
  partitionKey,
  getHeadCellText,
  openBookingForm,
}) => {
  const { data, isLoading } = query;
  const appointments =
    useAppointmentsQuery({
      after: displayedDates[0],
      before: endOfDay(displayedDates[displayedDates.length - 1]),
    }).data?.data ?? [];

  if (isLoading) return <SkeletonRows colCount={displayedDates.length} />;
  if (data?.length === 0) return <EmptyStateRow />;

  const partitionedAppointments = partitionAppointmentsByKey(appointments, partitionKey);

  return data?.map(entity => (
    <BookingsRow
      appointments={partitionedAppointments[entity.id] ?? []}
      dates={displayedDates}
      key={entity.id}
      entity={entity}
      getHeadCellText={getHeadCellText}
      openBookingForm={openBookingForm}
    />
  ));
};
