import { formatISO } from 'date-fns';
import React from 'react';

import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { partitionAppointmentsByDate } from './util';

export const BookingsCell = ({ appointments, date, location }) => (
  <CarouselGrid.Cell
    as="button"
    onClick={() => {
      // Open form for creating new booking
      window.alert(`Create new booking:\n\n${location.name}\n\n${date}`);
    }}
  >
    {appointments?.map(a => (
      <AppointmentTile appointment={a} key={a.id} />
    ))}
  </CarouselGrid.Cell>
);

export const BookingsRow = ({ appointments, dates, location }) => {
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
        />
      ))}
    </CarouselGrid.Row>
  );
};
