import { times } from 'lodash';

import { REPEAT_FREQUENCY } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
const { fake, chance } = require('@tamanu/shared/test-helpers/fake');

interface CreateAppointmentParams {
  models: Models;
  locationGroupId: string;
  patientId: string;
  clinicianId: string;
}

export const createAppointment = async ({
  models: { Appointment },
  locationGroupId,
  patientId,
  clinicianId,
}: CreateAppointmentParams): Promise<void> => {
  await Appointment.create(
    fake(Appointment, {
      patientId,
      clinicianId,
      locationGroupId,
    }),
  );
};

interface CreateRepeatingAppointmentParams extends CreateAppointmentParams {
  apptCount: number;
}

export const createRepeatingAppointment = async ({
  models: { AppointmentSchedule, Appointment },
  locationGroupId,
  patientId,
  clinicianId,
  apptCount = chance.number({ min: 1, max: 50 }),
}: CreateRepeatingAppointmentParams): Promise<void> => {
  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId,
    }),
  );

  times(apptCount, async () => {
    await Appointment.create(
      fake(Appointment, {
        patientId,
        clinicianId,
        locationGroupId,
        scheduleId: appointmentSchedule.id,
      }),
    );
  });
};
