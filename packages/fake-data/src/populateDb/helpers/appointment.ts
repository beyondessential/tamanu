import { times } from 'lodash';

import { REPEAT_FREQUENCY } from '@tamanu/constants';
import type { Models } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake';
interface CreateAppointmentParams {
  models: Models;
  locationGroupId: string;
  patientId: string;
  clinicianId: string;
}

export const createAppointment = async ({
  models,
  locationGroupId,
  patientId,
  clinicianId,
}: CreateAppointmentParams): Promise<void> => {
  const { Appointment } = models;
  await Appointment.create(
    fake(Appointment, {
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      clinicianId: clinicianId || (await randomRecordId(models, 'User')),
      locationGroupId: locationGroupId || (await randomRecordId(models, 'LocationGroup')),
    }),
  );
};

interface CreateRepeatingAppointmentParams extends CreateAppointmentParams {
  apptCount?: number;
}

export const createRepeatingAppointment = async ({
  models,
  locationGroupId,
  patientId,
  clinicianId,
  apptCount = chance.integer({ min: 1, max: 50 }),
}: CreateRepeatingAppointmentParams): Promise<void> => {
  const { AppointmentSchedule, Appointment } = models;
  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId: locationGroupId || (await randomRecordId(models, 'LocationGroup')),
    }),
  );

  await Promise.all(
    times(apptCount, async () => {
      await Appointment.create(
        fake(Appointment, {
          patientId: patientId || (await randomRecordId(models, 'Patient')),
          clinicianId: clinicianId || (await randomRecordId(models, 'User')),
          locationGroupId: locationGroupId || (await randomRecordId(models, 'LocationGroup')),
          scheduleId: appointmentSchedule.id,
        }),
      );
    }),
  );
};
