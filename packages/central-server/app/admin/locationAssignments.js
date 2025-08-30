import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Sequelize, Op } from 'sequelize';
import { isValid, parseISO, isBefore, differenceInMonths, addMonths, isAfter } from 'date-fns';
import { generateFrequencyDates, getNextFrequencyDate } from '@tamanu/utils/appointmentScheduling';
import { InvalidOperationError, NotFoundError } from '@tamanu/shared/errors';
import { toDateString } from '@tamanu/utils/dateTime';
export const locationAssignmentsRouter = express.Router();

import {
  REPEAT_FREQUENCY_VALUES,
} from '@tamanu/constants';

const dateStringValidator = z.string()
  .refine((val) => isValid(parseISO(val)), {
    message: 'Must be a valid date string',
  });

const locationAssignmentSchema = z.object({
  userId: z.string(),
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
      data: rows,
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

    const maxFutureMonths = await req.settings.get('locationAssignments.assignmentMaxFutureMonths');
    const maxAssignmentDate = addMonths(new Date(), maxFutureMonths);    
    
    if (body.isRepeating && isAfter(parseISO(body.repeatEndDate), maxAssignmentDate)) {
      throw new InvalidOperationError(`End date should not be greater than ${toDateString(maxAssignmentDate)}`);
    }

    if (body.isRepeating && isAfter(parseISO(body.date), maxAssignmentDate)) {
      throw new InvalidOperationError(`Date should not be greater than ${toDateString(maxAssignmentDate)}`);
    }

    if (body.isRepeating && !body.repeatEndDate) {
      throw new InvalidOperationError('End date is required for repeating assignments');
    }

    const overlapAssignments = await findOverlappingAssignments(models, body);
    
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
    if (!assignment) {
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

    const maxFutureMonths = await req.settings.get('locationAssignments.assignmentMaxFutureMonths');
    if (body.isRepeating && differenceInMonths(parseISO(body.repeatEndDate), new Date()) > maxFutureMonths) {
      throw new InvalidOperationError(`End date should be within ${maxFutureMonths} months from today`);
    }

    if (body.isRepeating && differenceInMonths(parseISO(body.date), new Date()) > maxFutureMonths) {
      throw new InvalidOperationError(`Date should be within ${maxFutureMonths} months from today`);
    }

    if (body.isRepeating && !body.repeatEndDate) {
      throw new InvalidOperationError('End date is required for repeating assignments');
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
    if (!assignment) {
      throw new InvalidOperationError('Location assignment not found');
    }

    if (query.deleteFuture && !assignment.templateId) {
      throw new InvalidOperationError('Cannot delete future assignments for non-repeating assignments');
    }

    if (query.deleteFuture) {
      await db.transaction(async () => {
        await deleteSelectedAndFutureAssignments(models, assignment.templateId, assignment.date, user);
      });
    } else {
      await assignment.destroy();
    }

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
      assignmentDates = generateFrequencyDates(
        body.date,
        body.repeatEndDate,
        body.repeatFrequency,
        body.repeatUnit,
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

    await template.generateRepeatingLocationAssignments();
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
  const overlapAssignments = await findOverlappingAssignments(models, {
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
      await assignment.destroy();

      overlapAssignments = await findOverlappingAssignments(models, {
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
  const { user, store: { models }, db } = req;
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
        
        overlapAssignments = await findOverlappingAssignments(models, body);

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
        
        await newTemplate.generateRepeatingLocationAssignments();
      } 
      // If only the end date is changed and new end date is before current end date, delete future assignments
      else if (body.repeatEndDate < template.repeatEndDate) { 
        await LocationAssignment.destroy({
          where: {
            templateId: template.id,
            date: { [Op.gt]: body.repeatEndDate },
          },
        });

        await template.update({
          repeatEndDate: body.repeatEndDate,
          updatedBy: user.id,
        });
      }
      // If the end date is changed and new end date is greater than current end date, check overlap for future assignments
      else if (body.repeatEndDate > template.repeatEndDate) {
        const latestAssignment = await LocationAssignment.findOne({
          where: {
            templateId: template.id,
          },
          order: [['date', 'DESC']],
        });
        const nextAssignmentDate = getNextFrequencyDate(latestAssignment.date, template.repeatFrequency, template.repeatUnit);

        overlapAssignments = await findOverlappingAssignments(models, {
          locationId: body.locationId,
          date: nextAssignmentDate,
          startTime: body.startTime,
          endTime: body.endTime,
          isRepeating: true,
          repeatFrequency: template.repeatFrequency,
          repeatUnit: template.repeatUnit,
          repeatEndDate: body.repeatEndDate,
        });
        
        if (overlapAssignments?.length > 0) {
          throw new InvalidOperationError('Location assignment overlaps with existing assignments');
        }
        
        await template.update({
          repeatEndDate: body.repeatEndDate,
          updatedBy: user.id,
        });

        await template.generateRepeatingLocationAssignments();
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
  const latestAssignment = await LocationAssignment.findOne({
    where: {
      templateId,
    },
    order: [['date', 'DESC']],
  });

  if (!latestAssignment) {
    return await LocationAssignmentTemplate.destroy({
      where: {
        id: templateId,
      },
    });
  }

  // Update the repeat end date to the latest assignment date
  await LocationAssignmentTemplate.update({
    repeatEndDate: latestAssignment.date,
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
async function findOverlappingAssignments(models, body, options = {}) {
  const { LocationAssignment, User } = models;
  const { locationId, date, startTime, endTime, isRepeating, repeatFrequency, repeatUnit, repeatEndDate } = body;

  let dateFilter = {
    [Op.eq]: date,
  };
  if (isRepeating) {
    const assignmentDates = generateFrequencyDates(
      date,
      repeatEndDate,
      repeatFrequency,
      repeatUnit,
    );

    dateFilter = {
      [Op.in]: assignmentDates,
    }
  }
  const assignmentFilter = {
    locationId,
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
    date: dateFilter,
    ...(options.excludeAssignmentId && { id: { [Op.ne]: options.excludeAssignmentId } }),
  }

  const overlappingNonRepeatingAssignments = await LocationAssignment.findAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
    }],
    where: {
      ...assignmentFilter,
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

  const overlappingRepeatingAssignments = await LocationAssignment.findAll({
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
    }],
    where: {
      ...assignmentFilter,
      templateId: { [Op.ne]: null },
    },
    attributes: ['templateId', [Sequelize.fn('MIN', Sequelize.col('date')), 'date'], 'startTime', 'endTime', 'locationId'],
    group: ['templateId', 'startTime', 'endTime', 'locationId', 'user.id', 'user.display_name', 'user.email'],
  });

  return [...overlappingRepeatingAssignments, ...overlappingNonRepeatingAssignments].map((assignment) => ({
    date: assignment.date,
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    locationId: assignment.locationId,
    user: assignment.user,
    templateId: assignment.templateId,
    isRepeating: !!assignment.templateId,
  }));
}
