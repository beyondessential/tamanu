import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfToday } from 'date-fns';
import { Op, Sequelize, literal } from 'sequelize';
import { simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import { escapePatternWildcard } from '../../utils/query';
import { NotFoundError, ResourceConflictError } from '@tamanu/shared/errors';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

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

appointments.post('/$', simplePost('Appointment'));
appointments.put('/:id', simplePut('Appointment'));

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

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Appointment');
    const {
      models: { Appointment },
      query: {
        after = startOfToday(),
        before,
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

    // If only an ‘after’ time is provided, use legacy behaviour and query only by appointment start times
    const shouldQueryByOverlap = !!before;
    const timeQueryWhereClause = shouldQueryByOverlap
      ? literal(
          '("Appointment"."start_time"::TIMESTAMP, "Appointment"."end_time"::TIMESTAMP) OVERLAPS ($afterDateTime, $beforeDateTime)',
        )
      : {
          startTime: { [Op.gte]: after },
        };
    const timeQueryBindParams = shouldQueryByOverlap
      ? {
          afterDateTime: `'${toDateTimeString(after)}'`,
          beforeDateTime: `'${toDateTimeString(before)}'`,
        }
      : null;

    const cancelledStatusQuery = includeCancelled
      ? null
      : { status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED } };

    const ilikePatientNameOrId = { [Op.iLike]: `%${escapePatternWildcard(patientNameOrId)}%` };
    const patientNameOrIdQuery = !patientNameOrId
      ? null
      : {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                'concat',
                Sequelize.col('patient.first_name'),
                ' ',
                Sequelize.col('patient.last_name'),
              ),
              ilikePatientNameOrId,
            ),
            { '$patient.display_id$': ilikePatientNameOrId },
          ],
        };

    const filters = Object.entries(queries).reduce((_filters, [queryField, queryValue]) => {
      if (!searchableFields.includes(queryField)) {
        return _filters;
      }
      if (!(typeof queryValue === 'string') && !Array.isArray(queryValue)) {
        return _filters;
      }

      const column = queryField.includes('.') // querying on a joined table (associations)
        ? `$${queryField}$`
        : queryField;

      const comparison = Array.isArray(queryValue)
        ? { [Op.in]: queryValue }
        : { [Op.iLike]: `%${escapePatternWildcard(queryValue)}%` };

      _filters.push({ [column]: comparison });

      return _filters;
    }, []);

    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[sortKeys[orderBy] || orderBy, order]],
      where: {
        [Op.and]: [timeQueryWhereClause, cancelledStatusQuery, patientNameOrIdQuery, ...filters],
      },
      include: [...Appointment.getListReferenceAssociations()],
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
