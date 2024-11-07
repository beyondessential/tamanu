import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfToday } from 'date-fns';
import { Op, Sequelize } from 'sequelize';
import { simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';
import { escapePatternWildcard } from '../../utils/query';
import { NotFoundError, ResourceConflictError } from '@tamanu/shared/errors';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';

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
  const { models, body, params } = req;
  const { id } = params;
  const { startTime, endTime, locationId } = body;
  const { Appointment } = models;

  req.checkPermission('create', 'Appointment');

  try {
    const result = await Appointment.sequelize.transaction(async transaction => {
      const existingBooking = await Appointment.findByPk(id, { transaction });

      if (!existingBooking) {
        throw new NotFoundError();
      }
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

      const updatedRecord = await existingBooking.update(body, { transaction });
      return updatedRecord;
    });

    res.status(200).send(result);
  } catch (error) {
    res.status(error.status || 500).send();
  }
});

const searchableFields = [
  'startTime',
  'endTime',
  'type',
  'status',
  'clinicianId',
  'locationId',
  'locationGroupId',
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
};

appointments.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Appointment');
    const {
      models,
      query: {
        after,
        before,
        rowsPerPage = 10,
        page = 0,
        all = false,
        order = 'ASC',
        orderBy = 'startTime',
        ...queries
      },
    } = req;
    const { Appointment } = models;

    const afterTime = after || startOfToday();
    const startTimeQuery = {
      [Op.gte]: afterTime,
    };

    if (before) {
      startTimeQuery[Op.lte] = before;
    }
    const filters = Object.entries(queries).reduce((_filters, [queryField, queryValue]) => {
      if (!searchableFields.includes(queryField)) {
        return _filters;
      }
      if (!(typeof queryValue === 'string')) {
        return _filters;
      }
      let column = queryField;
      // querying on a joined table (associations)
      if (queryField.includes('.')) {
        column = `$${queryField}$`;
      }

      return {
        ..._filters,
        [column]: {
          [Op.iLike]: `%${escapePatternWildcard(queryValue)}%`,
        },
      };
    }, {});
    const { rows, count } = await Appointment.findAndCountAll({
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [[sortKeys[orderBy] || orderBy, order]],
      where: {
        status: { [Op.not]: APPOINTMENT_STATUSES.CANCELLED },
        startTime: startTimeQuery,
        ...filters,
      },
      include: [...Appointment.getListReferenceAssociations()],
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

appointments.put('/:id', simplePut('Appointment'));
