import { times } from 'lodash';

import { REPEAT_FREQUENCY } from '@tamanu/constants';
import { randomRecordId } from '../randomRecord.js';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams, ExtendedCommonParams } from './common.js';

interface CreateAppointmentParams extends CommonParams {
  locationGroupId?: string;
  patientId?: string;
  clinicianId?: string;
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

interface CreateRepeatingAppointmentParams extends ExtendedCommonParams<CreateAppointmentParams> {
  apptCount?: number;
}

export const createRepeatingAppointment = async ({
  models,
  locationGroupId,
  patientId,
  clinicianId,
  apptCount = chance.integer({ min: 2, max: 8 }),
}: CreateRepeatingAppointmentParams): Promise<void> => {
  const { AppointmentSchedule, Appointment } = models;

  // A repeating appointment is, semantically, the same patient and clinician
  // meeting at the same location on a schedule. Resolving these once (instead
  // of per-occurrence) also avoids N expensive `ORDER BY random()` queries
  // per schedule — a hot spot in seed generation.
  const resolvedLocationGroupId =
    locationGroupId ?? (await randomRecordId(models, 'LocationGroup'));
  const resolvedPatientId = patientId ?? (await randomRecordId(models, 'Patient'));
  const resolvedClinicianId = clinicianId ?? (await randomRecordId(models, 'User'));

  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId: resolvedLocationGroupId,
    }),
  );

  for (const _ of times(apptCount)) {
    await Appointment.create(
      fake(Appointment, {
        patientId: resolvedPatientId,
        clinicianId: resolvedClinicianId,
        locationGroupId: resolvedLocationGroupId,
        scheduleId: appointmentSchedule.id,
      }),
    );
  }
};
