/** Record<LocationId, Record<Date, Appointment> */
export const partitionAppointmentsByLocation = appointments =>
  appointments.reduce((acc, appt) => {
    const locationId = appt.locationId;
    (acc[locationId] || (acc[locationId] = [])).push(appt);
    return acc;
  }, {});

export const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const date = appt.startTime.slice(0, 10); // Slice out ISO date, no time
    (acc[date] || (acc[date] = [])).push(appt);
    return acc;
  }, {});
