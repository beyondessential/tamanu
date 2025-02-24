import { REPEAT_FREQUENCY } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateAppointmentDataParams {
  models: Models;
  locationGroupId: string;
  patientId: string;
  clinicianId: string;
}
export const createAppointmentData = async ({
  models: { AppointmentSchedule, Appointment },
  locationGroupId,
  patientId,
  clinicianId,
}: CreateAppointmentDataParams): Promise<void> => {
  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId,
    }),
  );
  await Appointment.create(
    fake(Appointment, {
      patientId,
      clinicianId,
      locationGroupId,
      scheduleId: appointmentSchedule.id,
    }),
  );
};
