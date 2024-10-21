import { formatISO } from 'date-fns';
import React from 'react';

import { CarouselComponents as CarouselGrid } from './CarouselComponents';
import { AppointmentTile } from '../../../components/Appointments/AppointmentTile';
import { partitionAppointmentsByDate } from './util';

export const BookingsCell = ({ appointments, date, location, openBookingForm }) => (
  <CarouselGrid.Cell
    onClick={() => {
      // Open form for creating new booking
      openBookingForm({ date, locationId: location.id });
    }}
  >
    {appointments?.map(a => (
      <AppointmentTile appointment={a} key={a.id} />
    ))}
  </CarouselGrid.Cell>
);

export const BookingsRow = ({ appointments, dates, location, openBookingForm }) => {
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
        />
      ))}
    </CarouselGrid.Row>
  );
};
