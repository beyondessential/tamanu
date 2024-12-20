import { format } from 'date-fns';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, Sequelize, literal } from 'sequelize';

import {
  APPOINTMENT_STATUSES,
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '@tamanu/constants';
import { NotFoundError, ResourceConflictError } from '@tamanu/shared/errors';
import { simplePut } from '@tamanu/shared/utils/crudHelpers';
import { replaceInTemplate } from '@tamanu/shared/utils/replaceInTemplate';

import { escapePatternWildcard } from '../../utils/query';

export const appointments = express.Router();

const timeOverlapWhereCondition = (startTime, endTime) => {
  return {
    [Op.or]: [
      // Partial overlap
      {
        startTime: {
          [Op.gte]: startTime, // Exclude startTime
          [Op.lt]: endTime, // Include endTime
        },
      },
      {
        endTime: {
          [Op.gt]: startTime, // Exclude endTime
          [Op.lte]: endTime, // Include startTime
        },
      },
      // Complete overlap
      {
        startTime: {
          [Op.lt]: startTime,
        },
        endTime: {
          [Op.gt]: endTime,
        },
      },
      // Same time
      {
        startTime: startTime,
        endTime: endTime,
      },
    ],
  };
};

appointments.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Appointment');
    const {
      models,
      db,
      body: { facilityId, appointmentSchedule, ...body },
      settings,
    } = req;
    const { Appointment, Facility, PatientCommunication } = models;

    await db.transaction(async () => {
      const result = appointmentSchedule
        ? (await Appointment.generateRepeatingAppointment(appointmentSchedule, body))[0]
        : await Appointment.create(body);
      // Fetch relations for the new appointment
      const [appointment, facility] = await Promise.all([
        Appointment.findByPk(result.id, {
          include: ['patient', 'clinician', 'locationGroup'],
        }),
        Facility.findByPk(facilityId),
      ]);

      const { patient, locationGroup, clinician } = appointment;

      if (body.email) {
        const appointmentConfirmationTemplate = await settings[facilityId].get(
          'templates.appointmentConfirmation',
        );

        const start = new Date(body.startTime);
        const content = replaceInTemplate(appointmentConfirmationTemplate.body, {
          firstName: patient.firstName,
          lastName: patient.lastName,
          facilityName: facility.name,
          startDate: format(start, 'dd-MM-yyyy'),
          startTime: format(start, 'hh:mm a'),
          locationName: locationGroup.name,
          clinicianName: clinician?.displayName ? `\nClinician: ${clinician.displayName}` : '',
        });

        await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.APPOINTMENT_CONFIRMATION,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          status: COMMUNICATION_STATUSES.QUEUED,
          destination: body.email,
          subject: appointmentConfirmationTemplate.subject,
          content,
          patientId: body.patientId,
        });
      }
      res.status(201).send(result);
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));

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
    req.checkPermission('list', 'Appointment');
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
        ...queries
      },
    } = req;

    const timeQueryWhereClause = literal(
      '("Appointment"."start_time"::TIMESTAMP, "Appointment"."end_time"::TIMESTAMP) OVERLAPS ($afterDateTime, $beforeDateTime)',
    );
    const timeQueryBindParams = {
      afterDateTime: `'${after}'`,
      beforeDateTime: `'${before}'`,
    };

    const cancelledStatusQuery = includeCancelled
      ? null
      : { status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED } };

    const facilityIdField = isStringOrArray(queries.locationGroupId)
      ? '$locationGroup.facility_id$'
      : '$location.facility_id$';
    const facilityIdQuery = facilityId ? { [facilityIdField]: facilityId } : null;

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
          facilityIdQuery,
          timeQueryWhereClause,
          cancelledStatusQuery,
          buildPatientNameOrIdQuery(patientNameOrId),
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

appointments.put('/:id', simplePut('Appointment'));

appointments.post('/locationBooking', async (req, res) => {
  req.checkPermission('create', 'Appointment');

  const { models, body } = req;
  const { startTime, endTime, locationId } = body;
  const { Appointment } = models;

  try {
    const result = await Appointment.sequelize.transaction(async transaction => {
      const bookingTimeAlreadyTaken = await Appointment.findOne({
        where: {
          locationId,
          status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED },
          ...timeOverlapWhereCondition(startTime, endTime),
        },
        transaction,
      });

      if (bookingTimeAlreadyTaken) {
        throw new ResourceConflictError();
      }

      const newRecord = await Appointment.create(body, { transaction });
      return newRecord;
    });

    res.status(201).send(result);
  } catch (error) {
    res.status(error.status || 500).send();
  }
});

appointments.put('/locationBooking/:id', async (req, res) => {
  req.checkPermission('create', 'Appointment');

  const { models, body, params, query } = req;
  const { id } = params;
  const { skipConflictCheck = false } = query;
  const { startTime, endTime, locationId } = body;
  const { Appointment } = models;

  try {
    const result = await Appointment.sequelize.transaction(async transaction => {
      const existingBooking = await Appointment.findByPk(id, { transaction });

      if (!existingBooking) {
        throw new NotFoundError();
      }

      if (!skipConflictCheck) {
        const bookingTimeAlreadyTaken = await Appointment.findOne({
          where: {
            id: { [Op.ne]: id },
            locationId,
            ...timeOverlapWhereCondition(startTime, endTime),
          },
          transaction,
        });

        if (bookingTimeAlreadyTaken) {
          throw new ResourceConflictError();
        }
      }

      const updatedRecord = await existingBooking.update(body, { transaction });
      return updatedRecord;
    });

    res.status(200).send(result);
  } catch (error) {
    res.status(error.status || 500).send();
  }
});
