import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op } from 'sequelize';
import { toDateString } from '@tamanu/utils/dateTime';
import { addWeeks, addMonths, isValid, parseISO, isBefore } from 'date-fns';
import { generateFutureAssignmentDates } from '@tamanu/utils/appointmentScheduling';
import { InvalidOperationError, ValidationError } from '@tamanu/shared/errors';

export const locationAssignmentsRouter = express.Router();

import {
  REPEAT_FREQUENCY_VALUES,
  LOCATION_ASSIGNMENT_STATUS
} from '@tamanu/constants';

const locationAssignmentSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string(),
  date: z.string().optional()
    .refine((val) => !val || isValid(parseISO(val)), {
      message: 'Date must be a valid date string',
    }),
  startTime: z.string(),
  endTime: z.string(),
  isRepeating: z.boolean(),
  isNeverEnding: z.boolean(),
  repeatEndDate: z.string().nullable(),
  repeatFrequency: z.number().int().positive(),
  repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES),
  occurrence: z.number().int().positive().nullable(),
});

const locationAssignmentsQuerySchema = z.object({
  after: z.string().optional()
    .refine((val) => !val || isValid(parseISO(val)), {
      message: 'after must be a valid date string',
    }),
  before: z.string().optional()
    .refine((val) => !val || isValid(parseISO(val)), {
      message: 'before must be a valid date string',
    }),
  locationId: z.string().optional(),
  facilityId: z.string().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  rowsPerPage: z.coerce.number().int().min(1).optional().default(50),
  all: z.string().optional().default('false')
    .transform((value) => value.toLowerCase() === 'true'),
});

locationAssignmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'LocationSchedule');

    const { store } = req;
    const { LocationAssignment, LocationAssignmentTemplate, User, Location } = store.models;

    const { data: query, error } = await locationAssignmentsQuerySchema.safeParseAsync(req.query);
    if (error) throw new ValidationError(error.errors.map((err) => err.message).join(', '));

    const { 
      after,
      before,
      locationId,
      facilityId,
      page,
      rowsPerPage,
      all,
    } = query;

    const includeOptions = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      },
      {
        model: LocationAssignmentTemplate,
        as: 'template',
        attributes: ['id', 'date', 'startTime', 'endTime', 'repeatFrequency', 'repeatUnit'],
      },
      {
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'facilityId'],
      }
    ];

    const filters = {
      status: LOCATION_ASSIGNMENT_STATUS.ACTIVE,
    };

    if (after) {
      filters.date = { [Op.gte]: after };
    }
    if (before) {
      filters.date = { 
        ...filters.date, 
        [Op.lte]: before 
      };
    }

    if (locationId) {
      filters.locationId = locationId;
    }

    if (facilityId) {
      filters['$location.facility_id$'] = facilityId;
    }

    const { rows, count } = await LocationAssignment.findAndCountAll({
      include: includeOptions,
      where: filters,
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    res.send({
      count,
      data: rows
    });
  }),
);

locationAssignmentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'LocationSchedule');

    const { data: body, error } = await locationAssignmentSchema.safeParseAsync(req.body);
    if (error) throw new ValidationError(error.errors.map((err) => err.message).join(', '));

    const { user, store } = req;
    const { User, Location, LocationAssignment } = store.models;

    const clinician = await User.findByPk(body.userId);
    if (!clinician) {
      throw new InvalidOperationError(`User not found`);
    }

    const location = await Location.findByPk(body.locationId);
    if (!location) {
      throw new InvalidOperationError(`Location not found`);
    }

    if (isBefore(parseISO(body.endTime), parseISO(body.startTime))) {
      throw new InvalidOperationError('Start time must be before end time');
    }

    body.repeatEndDate = calculateEndDate(body);

    const overlapAssignments = await checkAssignmentOverlap(
      req, 
      body,
    );
    
    if (overlapAssignments?.length > 0) {
      res.status(400).send({
        error: {
          message: 'Location assignment overlaps with existing assignments',
          type: 'overlap_assignment_error',
          overlapAssignments,
        },
      });
      return;
    }

    if (body.isRepeating) {
      await createRepeatingLocationAssignment(req, body);
    } else {
      await LocationAssignment.create({
        userId: body.userId,
        locationId: body.locationId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    res.status(201).send({ success: true });
  }),
);

const deleteLocationAssignmentSchema = z.object({
  deleteFuture: z.string().optional().default('false')
    .transform((value) => value.toLowerCase() === 'true'),
});

locationAssignmentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'LocationSchedule');

    const { id } = req.params;
    const { user, store, db } = req;
    const { LocationAssignment, LocationAssignmentTemplate } = store.models;

    const query = await deleteLocationAssignmentSchema.parseAsync(req.query);

    const assignment = await LocationAssignment.findByPk(id);
    if (!assignment || assignment.status !== LOCATION_ASSIGNMENT_STATUS.ACTIVE) {
      throw new InvalidOperationError('Location assignment not found');
    }

    await db.transaction(async () => {
      if (query.deleteFuture) {
        const templateId = assignment.templateId;
        if (!templateId || !query.deleteFuture) {
          return;
        }

        // Delete selected and future assignments for repeating location assignments
        await LocationAssignment.destroy({
          where: {
            templateId,
            date: { [Op.gte]: assignment.date },
          },
        });

        const latestActiveAssignment = await LocationAssignment.findOne({
          where: {
            templateId,
            status: LOCATION_ASSIGNMENT_STATUS.ACTIVE,
          },
          order: [['date', 'DESC']],
        });

        // Update the repeat end date to the latest active assignment date
        const repeatEndDate = latestActiveAssignment?.date || assignment.date;

        await LocationAssignmentTemplate.update({
          repeatEndDate,
          updatedBy: user.id,
        }, { 
          where: { 
            id: templateId,
          } 
        });
      } else {
        // Update the assignment to inactive to prevent it from being scheduled again
        await LocationAssignment.update({
          status: LOCATION_ASSIGNMENT_STATUS.INACTIVE,
          deactivationReason: 'manually_deleted',
          updatedBy: user.id,
        },{
          where: { 
            id,
          },
        })
      }
    });

    res.status(200).send({
      success: true,
    });
  }),
);

/**
 * Create a repeating location assignment with template and generate initial assignment
 */
async function createRepeatingLocationAssignment(req, body) {
  const {
    store: {
      models: { LocationAssignmentTemplate }
    },
    db,
    user,
    settings
  } = req;

  const { 
    userId,
    locationId,
    startTime,
    endTime,
    date,
    repeatEndDate,
    repeatUnit, 
    repeatFrequency, 
  } = body;

  await db.transaction(async () => {
    const template = await LocationAssignmentTemplate.create({
      userId,
      locationId,
      startTime,
      endTime,
      date,
      repeatEndDate,
      repeatFrequency,
      repeatUnit,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await template.generateRepeatingLocationAssignments(settings);
  });
}

/**
 * Check overlap for repeating location assignments
 */
async function checkAssignmentOverlap(req, body, locationAssignmentId = null, templateId = null) {
  const { LocationAssignment, LocationAssignmentTemplate, User } = req.store.models;
  const { locationId, date, startTime, endTime, isRepeating, repeatUnit, repeatFrequency, repeatEndDate } = body;

  let dateFilter = date;
  if (isRepeating) {
    const assignmentDates = generateFutureAssignmentDates(
      date,
      repeatFrequency,
      repeatUnit,
      repeatEndDate,
    );
    assignmentDates.push(date);

    dateFilter = {
      [Op.in]: assignmentDates,
    }
  }

  const assignmentFilter = {
    locationId,
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
    date: dateFilter,
    ...(locationAssignmentId && { id: { [Op.not]: locationAssignmentId } })
  }

  const [overlapTemplates, overlapAssignments] = await Promise.all([
    LocationAssignmentTemplate.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      },{
        model: LocationAssignment,
        as: 'locationAssignments',
        attributes: [
          'id',
          'date',
          'startTime',
          'endTime',
        ],
        where: {
          ...assignmentFilter,
        },
        required: true,
      }],
      where: {
        locationId,
        ...(templateId && {
          id: {
            [Op.not]: templateId
          },
        })
      },
      attributes: [
        'id',
        'userId',
        'locationId',
        'date',
        'startTime',
        'endTime',
        'repeatFrequency',
        'repeatUnit',
        'repeatEndDate',
      ],
      limit: 10,
    }),
    LocationAssignment.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      }],
      where: {
        ...assignmentFilter,
        templateId: null
      },
      attributes: [
        'id',
        'templateId',
        'locationId',
        'date',
        'startTime',
        'endTime',
      ],
      limit: 10,
    })
  ]);  

  const overlaps = overlapTemplates.map((template) => {
    const assignment = template.locationAssignments[0];

    return {
      id: assignment.id,
      date: assignment.date,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      locationId: assignment.locationId,
      user: template.user,
      templateId: template.id,
      isRepeating: true,
    }
  });

  for (const assignment of overlapAssignments) {
    overlaps.push({
      id: assignment.id,
      date: assignment.date,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      locationId: assignment.locationId,
      user: assignment.user,
      templateId: null,
      isRepeating: false,
    });
  }
  
  return overlaps;
}

function calculateEndDate(body) {
  const { date: startDate, isNeverEnding, repeatEndDate, repeatUnit, occurrence } = body;

  if (isNeverEnding) {
    return null;
  }
  
  if (repeatEndDate) {
    return repeatEndDate;
  }
  
  if (occurrence) {
    const startDateObj = parseISO(startDate);

    let endDate;
    switch (repeatUnit) {
      case 'WEEKLY':
        endDate = addWeeks(startDateObj, occurrence - 1);
        break;
      case 'MONTHLY':
        endDate = addMonths(startDateObj, occurrence - 1);
        break;
      default:
        throw new ValidationError(`Unsupported repeat unit: ${repeatUnit}`);
    }

    return toDateString(endDate);
  }

  return null;
}
