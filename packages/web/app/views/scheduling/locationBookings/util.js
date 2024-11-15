import { eachDayOfInterval, parseISO } from 'date-fns';

import { toDateString } from '@tamanu/shared/utils/dateTime';

/** Record<LocationId, Record<Date, Appointment> */
export const partitionAppointmentsByLocation = appointments =>
  appointments.reduce((acc, appt) => {
    const locationId = appt.locationId;
    (acc[locationId] || (acc[locationId] = [])).push(appt);
    return acc;
  }, {});

export const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const start = parseISO(appt.startTime);
    const end = parseISO(appt.endTime);

    const dates = eachDayOfInterval({ start, end }).map(toDateString);
    for (const date of dates) (acc[date] || (acc[date] = [])).push(appt);

    return acc;
  }, {});
