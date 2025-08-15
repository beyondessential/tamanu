import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op, where, fn, literal } from 'sequelize';
import { toDateString } from '@tamanu/utils/dateTime';
import { addMonths, isValid, parseISO, isBefore, getISODay } from 'date-fns';
import { generateFrequencyDates } from '@tamanu/utils/appointmentScheduling';
import { InvalidOperationError, NotFoundError } from '@tamanu/shared/errors';

export const locationAssignmentsRouter = express.Router();

import {
  REPEAT_FREQUENCY_VALUES,
  LOCATION_ASSIGNMENT_STATUS,
  MAX_OVERLAP_CHECK_MONTHS
} from '@tamanu/constants';

const dateStringValidator = z.string()
  .refine((val) => isValid(parseISO(val)), {
    message: 'Must be a valid date string',
  });

const locationAssignmentSchema = z.object({
  userId: z.string().uuid(),
  locationId: z.string(),
  date: dateStringValidator,
  startTime: z.string(),
  endTime: z.string(),
  isRepeating: z.boolean().optional().default(false),
  repeatEndDate: dateStringValidator.nullable().optional(),
  repeatFrequency: z.number().int().positive().optional(),
  repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
});

const locationAssignmentsQuerySchema = z.object({
  after: dateStringValidator.optional(),
  before: dateStringValidator.optional(),
  locationId: z.string().optional(),
  facilityId: z.string().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  rowsPerPage: z.coerce.number().int().min(1).optional().default(50),
  all: z.string().optional().default('false')
    .transform((value) => value.toLowerCase() === 'true'),
});

const overlappingLeavesSchema = z.object({
  userId: z.string().uuid(),
  date: dateStringValidator,
  isRepeating: z.boolean().optional().default(false),
  repeatEndDate: dateStringValidator.nullable().optional(),
  repeatFrequency: z.number().int().positive().optional(),
  repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
});

locationAssignmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'LocationSchedule');

    const { store } = req;
    const { LocationAssignment, LocationAssignmentTemplate, User, Location } = store.models;

    const query = await locationAssignmentsQuerySchema.parseAsync(req.query);

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
      date: {
        ...(after && { [Op.gte]: after }),
        ...(before && { [Op.lte]: before }),
      },
      ...(locationId && { locationId }),
      ...(facilityId && { '$location.facility_id$': facilityId }),
    };

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

    const body = await locationAssignmentSchema.parseAsync(req.body);

    const { store } = req;
    const { User, Location } = store.models;

    const clinician = await User.findByPk(body.userId);
    if (!clinician) {
      throw new NotFoundError(`User not found`);
    }

    const location = await Location.findByPk(body.locationId);
    if (!location) {
      throw new NotFoundError(`Location not found`);
    }

    if (isBefore(parseISO(body.endTime), parseISO(body.startTime))) {
      throw new InvalidOperationError('Start time must be before end time');
    }

    const overlapAssignments = await checkOverlappingWithSingleAssignments(
      req, 
      body,
    );
    const overlappingTemplates = await checkOverlappingWithTemplates(
      req,
      body,
    );
    
    if (overlapAssignments?.length > 0 || overlappingTemplates?.length > 0) {
      res.status(400).send({
        error: {
          message: 'Location assignment overlaps with existing assignments',
          type: 'overlap_assignment_error',
          overlapAssignments: [...overlappingTemplates, ...overlapAssignments],
        },
      });
      return;
    }
    
    if (body.isRepeating) {
      await createRepeatingLocationAssignment(req, body);
    } else {
      await createSingleLocationAssignment(req, body);
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

    if (query.deleteFuture && !assignment.templateId) {
      throw new InvalidOperationError('Cannot delete future assignments for non-repeating assignments');
    }

    await db.transaction(async () => {
      const templateId = assignment.templateId;
      // Not a repeating assignment
      if (!templateId) {
        return await LocationAssignment.destroy({
          where: { id },
        });
      }

      if (!query.deleteFuture) {
        // Update the assignment to inactive to prevent it from being scheduled again
        return await LocationAssignment.update({
          status: LOCATION_ASSIGNMENT_STATUS.INACTIVE,
          deactivationReason: 'manually_deleted',
          updatedBy: user.id,
        },{
          where: { 
            id,
          },
        });
      }

      // Delete selected and future assignments for repeating location assignments
      await LocationAssignment.destroy({
        where: {
          templateId,
          date: { [Op.gte]: assignment.date },
        },
      });

      // Get the latest non-deleted assignment
      const latestActiveAssignment = await LocationAssignment.findOne({
        where: {
          templateId,
          status: LOCATION_ASSIGNMENT_STATUS.ACTIVE,
        },
        order: [['date', 'DESC']],
      });

      if (!latestActiveAssignment) {
        return await LocationAssignmentTemplate.destroy({
          where: {
            id: templateId,
          },
        });
      }

      // Update the repeat end date to the latest active assignment date
      await LocationAssignmentTemplate.update({
        repeatEndDate: latestActiveAssignment.date,
        updatedBy: user.id,
      }, { 
        where: { 
          id: templateId,
        } 
      });
    });

    res.status(200).send({
      success: true,
    });
  }),
);

locationAssignmentsRouter.post(
  '/overlapping-leaves',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'User');

    const { store } = req;
    const { UserLeave } = store.models;

    const body = await overlappingLeavesSchema.parseAsync(req.body);

    let assignmentDates = [body.date];
    if (body.isRepeating) {
      const maxGenerationMonths = await req.settings.get(
        'locationAssignments.maxViewableMonthsAhead'
      );

      assignmentDates = generateFutureAssignmentDates(
        body.date,
        body.repeatEndDate,
        body.repeatFrequency,
        body.repeatUnit,
        maxGenerationMonths,
      );
    }

    const userLeaves = await UserLeave.findAll({
      where: {
        userId: body.userId,
        removedAt: null,
        endDate: { [Op.gte]: assignmentDates[0] },
        startDate: { [Op.lte]: assignmentDates.at(-1) }
      },
      attributes: ['id', 'startDate', 'endDate', 'userId'],
    });

    const overlappingLeaves = userLeaves.filter((leave) => {
      return assignmentDates.some((date) => 
        leave.startDate <= date && date <= leave.endDate
      );
    });

    res.send({
      userLeaves: overlappingLeaves,
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

async function createSingleLocationAssignment(req, body) {
  const { user, store } = req;
  const { LocationAssignment, UserLeave } = store.models;
  const { userId, locationId, date, startTime, endTime } = body;

  const userLeave = await UserLeave.findOne({
    where: {
      userId,
      removedAt: null,
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
    },
    attributes: ['id'],
  });

  if (userLeave) {
    throw new InvalidOperationError(`User is on leave on ${date}`);
  }

  await LocationAssignment.create({
    userId,
    locationId,
    date,
    startTime,
    endTime,
    createdBy: user.id,
    updatedBy: user.id,
  });
}

/**
 * Check if the new assignment overlaps with existing generated assignments.
 */
async function checkOverlappingWithSingleAssignments(req, body) {
  const { LocationAssignment, User } = req.store.models;
  const { locationId, date, startTime, endTime, isRepeating, repeatFrequency, repeatUnit, repeatEndDate } = body;

  let dateFilter = {
    [Op.eq]: date,
  };
  if (isRepeating) {
    const assignmentDates = generateFutureAssignmentDates(
      date,
      repeatEndDate,
      repeatFrequency,
      repeatUnit,
      MAX_OVERLAP_CHECK_MONTHS,
    );

    dateFilter = {
      [Op.in]: assignmentDates,
    }
  }

  const overlappingAssignments = await LocationAssignment.findAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
    }],
    where: {
      locationId,
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
      date: dateFilter,
      templateId: null,
    },
    attributes: [
      'id',
      'locationId',
      'date',
      'startTime',
      'endTime',
    ],
    limit: 10,
  });

  return overlappingAssignments.map((assignment) => ({
    id: assignment.id,
    date: assignment.date,
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    locationId: assignment.locationId,
    user: assignment.user,
    templateId: null,
    isRepeating: false,
  }));
}

/**
 * Checks if a new assignment overlaps with templates that extend beyond current generation window.
 */
async function checkOverlappingWithTemplates(req, body) {
  const { LocationAssignmentTemplate, LocationAssignment, User } = req.store.models;

  const startDate = body.date;
  const endDate = body.isRepeating 
    ? body.repeatEndDate
    : body.date;
  
  const targetDayOfWeek = getISODay(parseISO(body.date));
  const templatesBeyondGenerationWindow = await LocationAssignmentTemplate.findAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
    }],
    where: {
      [Op.and]: [
        { locationId: body.locationId },
        {
          [Op.or]: [
            { repeatEndDate: null },
            { repeatEndDate: { [Op.gte]: startDate } },
          ],
        },
        endDate && { date: { [Op.lte]: endDate } },
        { startTime: { [Op.lt]: body.endTime } },
        { endTime: { [Op.gt]: body.startTime } },
        // Query templates with the same day of week
        where(
          fn('EXTRACT', literal('ISODOW FROM "date"::date')),
          targetDayOfWeek
        )
      ]
    },
  });

  let newAssignmentDates = [body.date];
  if (body.isRepeating) {
    newAssignmentDates = generateFutureAssignmentDates(
      body.date,
      body.repeatEndDate,
      body.repeatFrequency,
      body.repeatUnit,
      MAX_OVERLAP_CHECK_MONTHS,
    );
  }

  const newAssignmentDateSet = new Set(newAssignmentDates);
  const overlappingTemplates = [];
  for (const template of templatesBeyondGenerationWindow) {
    let generateUntil = endDate || template.repeatEndDate;
    if (endDate && template.repeatEndDate) {
      generateUntil = endDate < template.repeatEndDate ? endDate : template.repeatEndDate;
    }

    const assignmentDates = generateFutureAssignmentDates(
      template.date,
      generateUntil,
      template.repeatFrequency,
      template.repeatUnit,
      MAX_OVERLAP_CHECK_MONTHS,
    );

    const inactiveAssignments = await LocationAssignment.findAll({
      where: {
        templateId: template.id,
        status: LOCATION_ASSIGNMENT_STATUS.INACTIVE,
      },
      attributes: ['date'],
    });
    const inactiveAssignmentDateSet = new Set(inactiveAssignments.map((assignment) => assignment.date));

    // Get the first overlapping date
    const overlappingDate = assignmentDates.find((date) => {
      return newAssignmentDateSet.has(date) && !inactiveAssignmentDateSet.has(date);
    });

    if (overlappingDate) {
      overlappingTemplates.push({
        id: null,
        date: overlappingDate,
        startTime: template.startTime,
        endTime: template.endTime,
        locationId: template.locationId,
        user: template.user,
        templateId: template.id,
        isRepeating: true,
      });
    }
  }
  
  return overlappingTemplates;
}

function generateFutureAssignmentDates(startDate, endDate, repeatFrequency, repeatUnit, maxGenerationMonths) {
  if (!endDate) {
    endDate = toDateString(addMonths(new Date(), maxGenerationMonths));
  }

  return generateFrequencyDates(startDate, endDate, repeatFrequency, repeatUnit);
}
