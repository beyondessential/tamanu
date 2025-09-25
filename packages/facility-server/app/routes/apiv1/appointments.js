import { format, addMilliseconds, differenceInMilliseconds, startOfDay, endOfDay, parse, isWithinInterval } from 'date-fns';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, Sequelize, literal } from 'sequelize';
import { omit } from 'lodash';
import { z } from 'zod';

import {
  APPOINTMENT_STATUSES,
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  MODIFY_REPEATING_APPOINTMENT_MODE,
  LOCATION_BOOKABLE_VIEW,
} from '@tamanu/constants';
import { NotFoundError, EditConflictError, InvalidOperationError } from '@tamanu/errors';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { datetimeCustomValidation, toDateTimeString, toDateString } from '@tamanu/utils/dateTime';

import { escapePatternWildcard } from '../../utils/query';

export const appointments = express.Router();

/**
 * @param {string} intervalStart Some valid PostgreSQL Date/Time input.
 * @param {string} intervalEnd Some valid PostgreSQL Date/Time input.
 * @see https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-INPUT
 */
const buildTimeQuery = (intervalStart, intervalEnd) => {
  const whereClause = literal(
    '("Appointment"."start_time"::TIMESTAMP, "Appointment"."end_time"::TIMESTAMP) OVERLAPS ($apptTimeQueryStart, $apptTimeQueryEnd)',
  );
  const bindParams = {
    apptTimeQueryStart: `'${intervalStart}'`,
    apptTimeQueryEnd: `'${intervalEnd}'`,
  };

  return [whereClause, bindParams];
};

const sendAppointmentReminder = async ({ appointmentId, email, facilityId, models, settings }) => {
  const { Appointment, Facility, PatientCommunication } = models;

  // Fetch appointment relations
  const [appointment, facility] = await Promise.all([
    Appointment.findByPk(appointmentId, {
      include: ['patient', 'clinician', 'locationGroup'],
    }),
    Facility.findByPk(facilityId),
  ]);

  const { patient, locationGroup, clinician } = appointment;

  const appointmentConfirmationTemplate = await settings[facilityId].get(
    'templates.appointmentConfirmation',
  );

  const start = new Date(appointment.startTime);
  const content = replaceInTemplate(appointmentConfirmationTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    facilityName: facility.name,
    startDate: format(start, 'PPPP'),
    startTime: format(start, 'p'),
    locationName: locationGroup.name,
    clinicianName: clinician?.displayName ? `\nClinician: ${clinician.displayName}` : '',
  });

  return await PatientCommunication.create({
    type: PATIENT_COMMUNICATION_TYPES.APPOINTMENT_CONFIRMATION,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: email,
    subject: appointmentConfirmationTemplate.subject,
    content,
    patientId: patient.id,
  });
};

appointments.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Appointment');
    const {
      models,
      db,
      body: { facilityId, schedule: scheduleData, ...appointmentData },
      settings,
    } = req;
    const { Appointment, PatientFacility } = models;
    const result = await db.transaction(async () => {
      const appointment = scheduleData
        ? (
            await Appointment.createWithSchedule({
              settings: settings[facilityId],
              appointmentData,
              scheduleData,
            })
          ).firstAppointment
        : await Appointment.create(appointmentData);

      await PatientFacility.findOrCreate({
        where: { patientId: appointment.patientId, facilityId },
      });

      const { email } = appointmentData;
      if (email) {
        await sendAppointmentReminder({
          appointmentId: appointment.id,
          email,
          facilityId,
          models,
          settings,
        });
      }

      return appointment;
    });
    res.status(201).send(result);
  }),
);

appointments.post(
  '/emailReminder',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Appointment');
    const {
      models,
      body: { facilityId, appointmentId, email },
      settings,
    } = req;
    const response = await sendAppointmentReminder({
      appointmentId,
      email,
      facilityId,
      models,
      settings,
    });
    res.status(200).send(response);
  }),
);

appointments.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');
    const { models, body, params, settings } = req;
    const { schedule: scheduleData, facilityId, modifyMode, ...appointmentData } = body;

    const { id } = params;
    const { Appointment } = models;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      throw new NotFoundError();
    }

    const result = await req.db.transaction(async () => {
      if (modifyMode === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS) {
        const existingSchedule = await appointment.getSchedule();
        if (!existingSchedule) {
          throw new Error('Cannot update future appointments for a non-recurring appointment');
        }
        if (
          existingSchedule.isDifferentFromSchedule(scheduleData) ||
          appointmentData.startTime !== appointment.startTime ||
          appointmentData.endTime !== appointment.endTime
        ) {
          // If the appointment schedule has been modified, we need to regenerate the schedule from the updated appointment.
          // To do this we cancel this and all future appointments and mark existing schedule as ended
          await existingSchedule.endAtAppointment(appointment);
          if (appointmentData.status !== APPOINTMENT_STATUSES.CANCELLED) {
            // Then if not cancelling the repeating appointments we generate a new schedule starting with the updated appointment
            const { schedule } = await Appointment.createWithSchedule({
              settings: settings[facilityId],
              appointmentData: omit(appointmentData, 'id'),
              scheduleData: omit(scheduleData, 'id'),
            });
            return { schedule };
          }
        } else {
          // No scheduleData or appointment time change, so this is a simple change that doesn't require deleting and regenerating future appointments
          await existingSchedule.modifyFromAppointment(
            appointment,
            // When modifying all future appointments we strip startTime, and endTime
            // in order to preserve the incremental time difference between appointments
            omit(appointmentData, 'id', 'startTime', 'endTime'),
          );
        }
      } else {
        await appointment.update(appointmentData);
      }
      return { ok: 'ok' };
    });
    res.status(200).send(result);
  }),
);

const isStringOrArray = obj => typeof obj === 'string' || Array.isArray(obj);

const searchableFields = [
  'startTime',
  'endTime',
  'type',
  'appointmentTypeId',
  'bookingTypeId',
  'status',
  'clinicianId',
  'locationId',
  'locationGroupId',
  'patientId',
  'patient.first_name',
  'patient.last_name',
  'patient.display_id',
];

const sortKeys = {
  patientName: Sequelize.fn(
    'concat',
    Sequelize.col('patient.first_name'),
    ' ',
    Sequelize.col('patient.last_name'),
  ),
  displayId: Sequelize.col('patient.display_id'),
  sex: Sequelize.col('patient.sex'),
  dateOfBirth: Sequelize.col('patient.date_of_birth'),
  location: Sequelize.col('location.name'),
  locationGroup: Sequelize.col('location_groups.name'),
  clinician: Sequelize.col('clinician.display_name'),
  bookingType: Sequelize.col('bookingType.name'),
  appointmentType: Sequelize.col('appointmentType.name'),
  outpatientAppointmentArea: Sequelize.col('locationGroup.name'),
  bookingArea: Sequelize.col('location.locationGroup.name'),
};

const buildPatientNameOrIdQuery = patientNameOrId => {
  if (!patientNameOrId) return null;

  const ilikeClause = {
    [Op.iLike]: `%${escapePatternWildcard(patientNameOrId)}%`,
  };
  return {
    [Op.or]: [
      Sequelize.where(
        Sequelize.fn(
          'concat',
          Sequelize.col('patient.first_name'),
          ' ',
          Sequelize.col('patient.last_name'),
        ),
        ilikeClause,
      ),
      { '$patient.display_id$': ilikeClause },
    ],
  };
};

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkListOrReadPermission('Appointment');

    const {
      models: { Appointment },
      query: {
        /**
         * Midnight today
         * @see https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-SPECIAL-VALUES
         */
        after = 'today',
        before = 'infinity',
        facilityId,
        rowsPerPage = 10,
        page = 0,
        all = false,
        order = 'ASC',
        orderBy = 'startTime',
        patientNameOrId,
        includeCancelled = false,
        view,
        ...queries
      },
    } = req;

    const [timeQueryWhereClause, timeQueryBindParams] = buildTimeQuery(after, before);

    const cancelledStatusWhereClause = includeCancelled
      ? null
      : { status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED } };

    const facilityIdField = isStringOrArray(queries.locationGroupId)
      ? '$locationGroup.facility_id$'
      : '$location.facility_id$';
    const facilityIdWhereClause = facilityId ? { [facilityIdField]: facilityId } : null;

    const isBeforeScheduleUntilDateWhereClause = {
      [Op.or]: [
        { scheduleId: null },
        literal(`
        ("schedule"."until_date" IS NULL OR "schedule"."until_date"::timestamp + interval '1 day' - interval '1 second' >= start_time::timestamp)
      `),
      ],
    };
    
    const bookableWhereClause = [LOCATION_BOOKABLE_VIEW.DAILY, LOCATION_BOOKABLE_VIEW.WEEKLY].includes(view) ? {
      '$location.locationGroup.is_bookable$': {
        [Op.in]: [LOCATION_BOOKABLE_VIEW.ALL, view]
      }
    } : null;

    const filters = Object.entries(queries).reduce((_filters, [queryField, queryValue]) => {
      if (!searchableFields.includes(queryField) || !isStringOrArray(queryValue)) {
        return _filters;
      }

      const column = queryField.includes('.') // querying on a joined table (associations)
        ? `$${queryField}$`
        : queryField;

      let comparison;
      if (queryValue === '' || queryValue.length === 0) {
        comparison = { [Op.not]: null };
      } else if (typeof queryValue === 'string') {
        comparison = { [Op.iLike]: `%${escapePatternWildcard(queryValue)}%` };
      } else {
        comparison = { [Op.in]: queryValue };
      }

      _filters.push({ [column]: comparison });
      return _filters;
    }, []);

    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[sortKeys[orderBy] || orderBy, order]],
      where: {
        [Op.and]: [
          facilityIdWhereClause,
          timeQueryWhereClause,
          cancelledStatusWhereClause,
          isBeforeScheduleUntilDateWhereClause,
          buildPatientNameOrIdQuery(patientNameOrId),
          bookableWhereClause,
          ...filters,
        ],
      },
      include: Appointment.getListReferenceAssociations(),
      bind: timeQueryBindParams,
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

appointments.post(
  '/locationBooking',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Appointment');

    const { models, body } = req;
    const { startTime, endTime, locationId, patientId, procedureTypeIds } = body;
    const { Appointment, PatientFacility, Location } = models;

    try {
      const result = await Appointment.sequelize.transaction(async transaction => {
        const [timeQueryWhereClause, timeQueryBindParams] = buildTimeQuery(startTime, endTime);
        const conflictCount = await Appointment.count({
          where: {
            [Op.and]: [
              { locationId },
              {
                status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED },
              },
              timeQueryWhereClause,
            ],
          },
          bind: timeQueryBindParams,
          transaction,
        });

        if (conflictCount > 0) throw new EditConflictError();

        const location = await Location.findByPk(locationId, { transaction });
        if (!location) throw new NotFoundError('Location not found');

        await PatientFacility.findOrCreate({
          where: { patientId, facilityId: location.facilityId },
          transaction,
        });

        const appointment = await Appointment.create(body, { transaction });

        if (procedureTypeIds) {
          await appointment.setProcedureTypes(procedureTypeIds);
        }

        return appointment;
      });

      res.status(201).send(result);
    } catch (error) {
      res.status(error.status || 500).send();
    }
  }),
);

appointments.put(
  '/locationBooking/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');

    const { models, body, params, query } = req;
    const { id } = params;
    const { skipConflictCheck = false } = query;
    const { startTime, endTime, locationId, procedureTypeIds } = body;
    const { Appointment } = models;

    try {
      const result = await Appointment.sequelize.transaction(async transaction => {
        const existingBooking = await Appointment.findByPk(id, { transaction });

        if (!existingBooking) {
          throw new NotFoundError();
        }

        if (!skipConflictCheck) {
          const [timeQueryWhereClause, timeQueryBindParams] = buildTimeQuery(startTime, endTime);
          const bookingTimeAlreadyTaken = await Appointment.findOne({
            where: {
              [Op.and]: [
                {
                  id: { [Op.ne]: id },
                },
                { locationId },
                timeQueryWhereClause,
              ],
            },
            bind: timeQueryBindParams,
            transaction,
          });

          if (bookingTimeAlreadyTaken) {
            throw new EditConflictError();
          }
        }

        const updatedRecord = await existingBooking.update(body, { transaction });

        await updatedRecord.setProcedureTypes(procedureTypeIds);

        return updatedRecord;
      });

      res.status(200).send(result);
    } catch (error) {
      res.status(error.status || 500).send();
    }
  }),
);

const moveAppointmentSchema = z.object({
  facilityId: z.string(),
  startTime: datetimeCustomValidation,
});

appointments.put(
  '/locationBooking/:id/move',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');

    const { models, params, settings } = req;
    const { id } = params;
    const { Appointment, LocationAssignment } = models;
    
    const body = await moveAppointmentSchema.parseAsync(req.body);

    const bookingSlotStartTime = await settings[body.facilityId].get('appointments.bookingSlots.startTime');
    const bookingSlotEndTime = await settings[body.facilityId].get('appointments.bookingSlots.endTime');

    await Appointment.sequelize.transaction(async transaction => {

      let appointmentToMove = await Appointment.findByPk(id, { transaction });
      if (!appointmentToMove) {
        throw new InvalidOperationError('Appointment not found');
      }

      const newStartTime = new Date(body.startTime);
      const duration = differenceInMilliseconds(new Date(appointmentToMove.endTime), new Date(appointmentToMove.startTime));
      const newEndTime = addMilliseconds(newStartTime, duration);

      const locationAssignments = await LocationAssignment.findAll({
        where: {
          locationId: appointmentToMove.locationId,
          date: toDateString(newStartTime),
        },
      });

      if (!isValidBookingTime(newStartTime, newEndTime, bookingSlotStartTime, bookingSlotEndTime)) {
        throw new Error(`Appointment time must be within booking slot hours (${bookingSlotStartTime} - ${bookingSlotEndTime})`);
      }

      if (!isSameClinicianAllocation(appointmentToMove.startTime, newStartTime, locationAssignments)) {
        throw new InvalidOperationError('Appointment time must be within the same clinician allocation');
      }

      await appointmentToMove.update({
        startTime: toDateTimeString(newStartTime),
        endTime: toDateTimeString(newEndTime),
      });

      const appointmentsInDay = await Appointment.findAll({
        where: {
          [Op.and]: [
            { locationId: appointmentToMove.locationId },
            { status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED } },
            { startTime: { [Op.between]: [toDateTimeString(startOfDay(newStartTime)), toDateTimeString(endOfDay(newEndTime))] } },
            { id: { [Op.ne]: id } },
          ],
        },
        order: [['startTime', 'ASC']],
      });

      let shiftedAppointment = appointmentToMove;
      for (const appointment of appointmentsInDay) {
        const isOverlap = (appointment.startTime < appointmentToMove.endTime && appointment.endTime > appointmentToMove.startTime)
          || (appointment.startTime < shiftedAppointment.endTime && appointment.endTime > shiftedAppointment.startTime);
        
        if (!isOverlap) continue;

        const duration = differenceInMilliseconds(new Date(appointment.endTime), new Date(appointment.startTime));
        const startTime = new Date(shiftedAppointment.endTime);
        const endTime = addMilliseconds(startTime, duration);

        if (!isValidBookingTime(startTime, endTime, bookingSlotStartTime, bookingSlotEndTime)) {
          throw new InvalidOperationError(`Shifted appointment time must be within booking slot hours (${bookingSlotStartTime} - ${bookingSlotEndTime})`);
        }

        if (!isSameClinicianAllocation(appointment.startTime, startTime, locationAssignments)) {
          throw new InvalidOperationError('Shifted appointment time must be within the same clinician allocation');
        }

        await appointment.update({
          startTime: toDateTimeString(startTime),
          endTime: toDateTimeString(endTime),
        });

        shiftedAppointment = appointment;
      }
    });

    res.status(200).send({
      success: true,
    });
  }),
);

const isValidBookingTime = (startTime, endTime, bookingSlotStartTime, bookingSlotEndTime) => {
  const bookingDate = startTime;
  const slotStartDateTime = parse(bookingSlotStartTime, 'HH:mm', bookingDate);
  const slotEndDateTime = parse(bookingSlotEndTime, 'HH:mm', bookingDate);

  const isStartTimeValid = isWithinInterval(startTime, { start: slotStartDateTime, end: slotEndDateTime });
  const isEndTimeValid = isWithinInterval(endTime, { start: slotStartDateTime, end: slotEndDateTime });

  return isStartTimeValid && isEndTimeValid;
};

const isSameClinicianAllocation = (oldStartTime, newStartTime, locationAssignments) => {
  const oldAllocation = locationAssignments.find(assignment => {
    const assignmentStartTime = parse(assignment.startTime, 'HH:mm:ss', assignment.date);
    const assignmentEndTime = parse(assignment.endTime, 'HH:mm:ss', assignment.date);

    return isWithinInterval(oldStartTime, { start: assignmentStartTime, end: assignmentEndTime });
  });

  const newAllocation = locationAssignments.find(assignment => {
    const assignmentStartTime = parse(assignment.startTime, 'HH:mm:ss', assignment.date);
    const assignmentEndTime = parse(assignment.endTime, 'HH:mm:ss', assignment.date);

    return isWithinInterval(newStartTime, { start: assignmentStartTime, end: assignmentEndTime });
  });

  if (!oldAllocation || !newAllocation) {
    return true;
  }

  return oldAllocation?.userId === newAllocation?.userId;
};
