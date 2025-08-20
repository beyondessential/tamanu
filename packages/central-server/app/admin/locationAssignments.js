import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op, where, fn, literal } from 'sequelize';
import { toDateString } from '@tamanu/utils/dateTime';
import { addMonths, isValid, parseISO, isBefore, getISODay } from 'date-fns';
import { generateFrequencyDates, getNextFrequencyDate } from '@tamanu/utils/appointmentScheduling';
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

const updateLocationAssignmentSchema = z.object({
  locationId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  updateFuture: z.boolean().default(false).optional(),
  // Only required when updateFuture is true
  isRepeating: z.boolean().default(false).optional(),
  repeatEndDate: z.string().nullable().optional(),
  repeatFrequency: z.number().int().positive().optional(),
  repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
});

const overlappingLeavesSchema = z.object({
  userId: z.string().uuid(),
  date: dateStringValidator,
  isRepeating: z.boolean().optional().default(false),
  repeatEndDate: dateStringValidator.nullable().optional(),
  repeatFrequency: z.number().int().positive().optional(),
  repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
});

const deleteLocationAssignmentSchema = z.object({
  deleteFuture: z.string().optional().default('false')
    .transform((value) => value.toLowerCase() === 'true'),
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

    const { store: { models } } = req;
    const { User, Location } = models;

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

    const overlapAssignments = await checkOverlappingAssignment(models, body);
    
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
      await createSingleLocationAssignment(req, body);
    }

    res.status(201).send({ success: true });
  }),
);

locationAssignmentsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'LocationSchedule');

    const { id } = req.params;
    const body = await updateLocationAssignmentSchema.parseAsync(req.body);

    const { store: { models } } = req;
    const { LocationAssignment, Location } = models;

    const assignment = await LocationAssignment.findByPk(id);
    if (!assignment || assignment.status !== LOCATION_ASSIGNMENT_STATUS.ACTIVE ) {
      throw new InvalidOperationError('Location assignment not found');
    }

    const location = await Location.findByPk(body.locationId);
    if (!location) {
      throw new InvalidOperationError('Location not found');
    }

    const startTime = body.startTime || assignment.startTime;
    const endTime = body.endTime || assignment.endTime;
    if (startTime >= endTime) {
      throw new InvalidOperationError('Start time must be before end time');
    }

    if (body.updateFuture && !assignment.templateId) {
      throw new InvalidOperationError('Cannot update future assignments for non-repeating assignment');
    }

    let result;
    if (!assignment.templateId) {
      result = await updateNonRepeatingAssignment(req, body, assignment);
    } else {
      if (body.updateFuture) {
        result = await updateFutureAssignments(req, body, assignment);
      } else {
        result = await updateSingleRepeatingAssignment(req, body, assignment);
      }
    }

    if (result.overlapAssignments?.length > 0) {
      res.status(400).send({
        error: {
          message: 'Location assignment overlaps with existing assignments',
          type: 'overlap_assignment_error',
          overlapAssignments: result.overlapAssignments,
        },
      });
      return;
    }

    res.status(200).send({ success: true });
  }),
);

locationAssignmentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'LocationSchedule');

    const { id } = req.params;
    const { user, store: { models }, db } = req;
    const { LocationAssignment } = models;

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

      await deleteSelectedAndFutureAssignments(models, templateId, assignment.date, user);
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

async function checkOverlappingAssignment(models, body, options = {}) {
  const [overlapAssignments, overlappingTemplates] = await Promise.all([
    checkOverlappingWithSingleAssignments(
      models, 
      body,
      options,
    ),
    checkOverlappingWithTemplates(
      models,
      body,
    )
  ]);

  return [...overlappingTemplates, ...overlapAssignments];
}

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

async function updateNonRepeatingAssignment(req, body, assignment) {
  const { store: { models }, user } = req;
  const overlapAssignments = await checkOverlappingAssignment(models, {
    locationId: body.locationId,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
  }, {
    excludeAssignmentId: assignment.id,
  });

  if (overlapAssignments?.length > 0) {
    return {
      success: false,
      overlapAssignments
    };
  }

  await assignment.update({
    locationId: body.locationId,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    updatedBy: user.id,
  });

  return { success: true };
}

async function updateSingleRepeatingAssignment(req, body, assignment) {
  const { user, store: { models }, db } = req;
  const { LocationAssignment } = models;
  let overlapAssignments = [];
  
  try {
    await db.transaction(async () => {
      await assignment.update({
        status: LOCATION_ASSIGNMENT_STATUS.INACTIVE,
        deactivationReason: 'manually_updated',
        updatedBy: user.id,
      });

      overlapAssignments = await checkOverlappingAssignment(models, {
        locationId: body.locationId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
      });

      if (overlapAssignments?.length > 0) {
        throw new InvalidOperationError('Location assignment overlaps with existing assignments');
      }

      await LocationAssignment.create({
        userId: assignment.userId,
        locationId: body.locationId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        createdBy: user.id,
        updatedBy: user.id,
      });
    });

    return { success: true };
  } catch (error) {
    if (overlapAssignments?.length > 0) {
      return {
        success: false,
        overlapAssignments,
      }
    }
    throw error;
  }
}

async function updateFutureAssignments(req, body, assignment) {
  const { user, store: { models }, db, settings } = req;
  const { LocationAssignment, LocationAssignmentTemplate } = models;
  let overlapAssignments = [];

  try {
    await db.transaction(async () => {
      if (!assignment.templateId) {
        throw new InvalidOperationError('Cannot update future assignments for non-repeating assignments');
      }

      const template = await LocationAssignmentTemplate.findByPk(assignment.templateId);
      if (!template) {
        throw new InvalidOperationError('Repeating assignment template not found');
      }

      // If the assignment is updated to non-repeating, delete future assignments and update end date
      if (!body.isRepeating) {
        await LocationAssignment.destroy({
          where: {
            templateId: template.id,
            date: { [Op.gt]: assignment.date },
          }
        });

        return await template.update({
          repeatEndDate: assignment.date,
          updatedBy: user.id,
        });
      } 
      
      if (isRescheduled(body, template, assignment.date)) {
        await deleteSelectedAndFutureAssignments(models, template.id, assignment.date, user);
        
        overlapAssignments = await checkOverlappingAssignment(models, body);

        if (overlapAssignments?.length > 0) {
          throw new InvalidOperationError('Location assignment overlaps with existing assignments');
        }

        // Create new assignment template
        const newTemplate = await LocationAssignmentTemplate.create({
          userId: template.userId,
          locationId: body.locationId,
          startTime: body.startTime,
          endTime: body.endTime,
          date: body.date,
          repeatEndDate: body.repeatEndDate,
          repeatFrequency: body.repeatFrequency,
          repeatUnit: body.repeatUnit,
          createdBy: user.id,
          updatedBy: user.id,
        });
        
        await newTemplate.generateRepeatingLocationAssignments(settings);
      } 
      // If only the end date is changed
      else if (body.repeatEndDate != template.repeatEndDate) {
        const newEndDate = body.repeatEndDate;
        const oldEndDate = template.repeatEndDate;

        // Delete future assignments if the new end date is before the current end date
        if (newEndDate && (newEndDate < oldEndDate || !oldEndDate)) {
          await LocationAssignment.destroy({
            where: {
              templateId: template.id,
              date: { [Op.gt]: newEndDate },
            },
          });
        }

        // If new end date is greater than the current end date, check overlap for future assignments
        if (!newEndDate || newEndDate > oldEndDate) {
          const latestAssignment = await LocationAssignment.findOne({
            where: {
              templateId: template.id,
            },
            order: [['date', 'DESC']],
          });
          const nextAssignmentDate = getNextFrequencyDate(latestAssignment.date, template.repeatFrequency, template.repeatUnit);

          overlapAssignments = await checkOverlappingAssignment(models, {
            locationId: body.locationId,
            date: nextAssignmentDate,
            startTime: body.startTime,
            endTime: body.endTime,
            isRepeating: true,
            repeatFrequency: template.repeatFrequency,
            repeatUnit: template.repeatUnit,
            repeatEndDate: newEndDate,
          });
          
          if (overlapAssignments?.length > 0) {
            throw new InvalidOperationError('Location assignment overlaps with existing assignments');
          }

          template.repeatEndDate = newEndDate;
          await template.generateRepeatingLocationAssignments(settings);
        }

        await template.update({
          repeatEndDate: newEndDate,
          updatedBy: user.id,
        });
      }
    });

    return { success: true };
  } catch (error) {
    if (overlapAssignments?.length > 0) {
      return {
        success: false,
        overlapAssignments,
      }
    }
    throw error;
  }
}

async function deleteSelectedAndFutureAssignments(models, templateId, assignmentDate, user) { 
  const { LocationAssignment, LocationAssignmentTemplate } = models;
  
  // Delete selected and future assignments for repeating location assignments
  await LocationAssignment.destroy({
    where: {
      templateId,
      date: { [Op.gte]: assignmentDate },
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
}

function isRescheduled(body, template, currentAssignmentDate) {
  return body.date != currentAssignmentDate
    || body.locationId != template.locationId
    || body.startTime != template.startTime
    || body.endTime != template.endTime
    || body.repeatFrequency != template.repeatFrequency
    || body.repeatUnit != template.repeatUnit;
}

/**
 * Check if the new assignment overlaps with existing generated assignments.
 */
async function checkOverlappingWithSingleAssignments(models, body, options = {}) {
  const { LocationAssignment, User } = models;
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
      ...(options.excludeAssignmentId && { id: { [Op.ne]: options.excludeAssignmentId } }),
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
async function checkOverlappingWithTemplates(models, body) {
  const { LocationAssignmentTemplate, LocationAssignment, User } = models;

  const startDate = body.date;
  const endDate = body.isRepeating 
    ? body.repeatEndDate
    : body.date;
  
  const targetDayOfWeek = getISODay(parseISO(body.date));
  const toCheckTemplates = await LocationAssignmentTemplate.findAll({
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
  for (const template of toCheckTemplates) {
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
