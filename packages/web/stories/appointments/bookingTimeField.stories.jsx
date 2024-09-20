import React from 'react';

import { BookingTimeField } from '../../app/components/Appointments/BookingTimeField';

// TODO: settings should probably be in wrapper context like translations
const settings = {
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: '30min',
};

export default {
  title: 'Appointments/Booking time field',
  component: BookingTimeField,
};

// TODO: args?
export const Disabled = () => <BookingTimeField disabled settings={settings} />;
export const RandomAvailability15Mins = () => <BookingTimeField settings={{...settings, slotDuration: '15min'}} />;
export const RandomAvailability30Mins = () => <BookingTimeField settings={settings} />;
export const RandomAvailability1Hr = () => <BookingTimeField settings={{...settings, slotDuration: '60min'}} />;
// export const PartialAvailability = () => <BookingTimeField settings={settings} />;
// export const NoAvailability = () => <BookingTimeField settings={settings} />;