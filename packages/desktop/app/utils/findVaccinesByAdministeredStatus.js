export const findVaccinesByAdministeredStatus = (vaccine, administered) =>
  vaccine
    ? vaccine.schedules
        .filter(s => s.administered === administered)
        .map(s => ({
          value: s.scheduledVaccineId,
          label: s.schedule,
        }))
    : [];
