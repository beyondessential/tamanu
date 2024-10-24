/** Record<string, Record<Date, Appointment> */
export const partitionAppointmentsByKey = (appointments, key) =>
  appointments.reduce((acc, appt) => {
    const groupId = appt[key];
    (acc[groupId] || (acc[groupId] = [])).push(appt);
    return acc;
  }, {});

export const partitionAppointmentsByDate = appointments =>
  appointments.reduce((acc, appt) => {
    const date = appt.startTime.slice(0, 10); // Slice out ISO date, no time
    (acc[date] || (acc[date] = [])).push(appt);
    return acc;
  }, {});
