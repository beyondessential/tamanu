import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { getAttributesFromSchema } from '../../utils/schemaUtils';
import { AppointmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { LocationGroupSchema } from '@tamanu/shared/schemas/patientPortal/responses/locationGroup.schema';
import { FacilitySchema } from '@tamanu/shared/schemas/patientPortal/responses/facility.schema';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { ReadSettings } from '@tamanu/settings';

const APPOINTMENT_ATTRIBUTES = {
  appointment: getAttributesFromSchema(AppointmentSchema),
  appointmentType: getAttributesFromSchema(AppointmentSchema.shape.appointmentType),
  facility: getAttributesFromSchema(FacilitySchema),
  locationGroup: getAttributesFromSchema(LocationGroupSchema),
  clinician: getAttributesFromSchema(AppointmentSchema.shape.clinician),
};

const createAppointmentIncludes = models => [
  {
    model: models.ReferenceData,
    as: 'appointmentType',
    attributes: APPOINTMENT_ATTRIBUTES.appointmentType,
  },
  {
    model: models.LocationGroup,
    as: 'locationGroup',
    attributes: APPOINTMENT_ATTRIBUTES.locationGroup,
    include: [
      {
        model: models.Facility,
        as: 'facility',
        attributes: APPOINTMENT_ATTRIBUTES.facility,
      },
    ],
  },
  {
    model: models.User,
    as: 'clinician',
    attributes: APPOINTMENT_ATTRIBUTES.clinician,
  },
];

export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const { patient } = req;
  const { models } = req.store;

  const appointmentIncludes = createAppointmentIncludes(models);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await models.Appointment.findAll({
    where: {
      patientId: patient.id,
      locationGroupId: {
        [Op.not]: null,
      },
      startTime: {
        [Op.gte]: toDateTimeString(today),
      },
    },
    attributes: APPOINTMENT_ATTRIBUTES.appointment,
    include: appointmentIncludes,
    order: [['startTime', 'ASC']],
  });

  // TODO: kinda horrible
  const settingReaders = {};
  res.send(
    await Promise.all(
      appointments.map(async appointment => {
        const facilityId = appointment.locationGroup.facilityId;
        if (!settingReaders[facilityId]) {
          settingReaders[facilityId] = new ReadSettings(models, {
            facilityId,
          });
        }
        const facilityTimeZone = await settingReaders[facilityId].get('facilityTimeZone');
        return AppointmentSchema.parse({
          ...appointment.forResponse(),
          facilityTimeZone,
        });
      }),
    ),
  );
});
