import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op, literal } from 'sequelize';
import { parseISO, isBefore, differenceInMonths, addMonths, isAfter } from 'date-fns';
import { generateFrequencyDates } from '@tamanu/utils/appointmentScheduling';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { toDateString, dateCustomValidation, timeCustomValidation } from '@tamanu/utils/dateTime';
export const locationAssignmentsRouter = express.Router();

import { REPEAT_FREQUENCY_VALUES } from '@tamanu/constants';

const customAssignmentValidation = (data, ctx) => {
  const repeatingFields = [data.repeatEndDate, data.repeatFrequency, data.repeatUnit];
  const existCount = repeatingFields.filter(v => v !== undefined && v !== null).length;

  if (existCount !== repeatingFields.length && existCount !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Repeat end date, frequency and unit are required for repeating assignments',
      path: ['repeatEndDate', 'repeatFrequency', 'repeatUnit'],
    });
  }

  if (isBefore(parseISO(data.endTime), parseISO(data.startTime))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start time must be before end time',
      path: ['startTime', 'endTime'],
    });
  }
};

const getLocationAssignmentsSchema = z.object({
  after: dateCustomValidation.optional(),
  before: dateCustomValidation.optional(),
  userId: z.string().optional(),
  locationId: z.string().optional(),
  facilityId: z.string().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  rowsPerPage: z.coerce.number().int().min(1).optional().default(50),
  all: z
    .string()
    .optional()
    .default('false')
    .transform(value => value.toLowerCase() === 'true'),
});
locationAssignmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'LocationSchedule');

    const { LocationAssignment, LocationAssignmentTemplate, User, Location, LocationGroup } =
      req.models;

    const query = await getLocationAssignmentsSchema.parseAsync(req.query);

    const { after, before, locationId, facilityId, userId, page, rowsPerPage, all } = query;

    const includeOptions = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      },
      {
        model: LocationAssignmentTemplate,
        as: 'template',
        attributes: [
          'id',
          'date',
          'startTime',
          'endTime',
          'repeatFrequency',
          'repeatUnit',
          'repeatEndDate',
        ],
      },
      {
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'facilityId'],
        include: [
          {
            model: LocationGroup,
            as: 'locationGroup',
            attributes: ['id', 'name', 'facilityId'],
          },
        ],
      },
    ];

    const filters = {
      date: {
        ...(after && { [Op.gte]: after }),
        ...(before && { [Op.lte]: before }),
      },
      ...(locationId && { locationId }),
      ...(userId && { userId }),
      ...(facilityId && {
        [Op.or]: [
          { '$location.facility_id$': facilityId },
          { '$location.locationGroup.facility_id$': facilityId },
        ],
      }),
    };

    const { rows, count } = await LocationAssignment.findAndCountAll({
      include: includeOptions,
      where: filters,
      limit: all ? undefined : rowsPerPage,
      offset: all ? undefined : page * rowsPerPage,
      order: [
        ['date', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

const createLocationAssignmentSchema = z
  .object({
    userId: z.string(),
    locationId: z.string(),
    date: dateCustomValidation,
    startTime: timeCustomValidation,
    endTime: timeCustomValidation,
    repeatEndDate: dateCustomValidation.nullable().optional(),
    repeatFrequency: z.number().int().positive().optional(),
    repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
  })
  .superRefine(customAssignmentValidation);
locationAssignmentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'LocationSchedule');

    const body = await createLocationAssignmentSchema.parseAsync(req.body);

    const { User } = req.models;

    const clinician = await User.findByPk(body.userId);
    if (!clinician) {
      throw new NotFoundError(`User not found`);
    }

    const maxFutureMonths = await req.settings.get('locationAssignments.assignmentMaxFutureMonths');
    const maxAssignmentDate = addMonths(new Date(), maxFutureMonths);

    if (isAfter(parseISO(body.date), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `Date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }
    if (body.repeatEndDate && isAfter(parseISO(body.repeatEndDate), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `End date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }

    const overlapAssignments = await findOverlappingAssignments(req.models, body);

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
    if (body.repeatFrequency) {
      await createRepeatingLocationAssignment(req, body);
    } else {
      await createSingleLocationAssignment(req, body);
    }

    res.status(201).send({ success: true });
  }),
);

const updateLocationAssignmentSchema = z
  .object({
    userId: z.string(),
    locationId: z.string(),
    date: dateCustomValidation,
    startTime: timeCustomValidation,
    endTime: timeCustomValidation,
    repeatEndDate: z.string().nullable().optional(),
    repeatFrequency: z.number().int().positive().optional(),
    repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
    updateAllNextRecords: z.boolean().default(false).optional(),
  })
  .superRefine(customAssignmentValidation);
locationAssignmentsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'LocationSchedule');

    const { id } = req.params;
    const body = await updateLocationAssignmentSchema.parseAsync(req.body);

    const { LocationAssignment } = req.models;

    const assignment = await LocationAssignment.findByPk(id);
    if (!assignment) {
      throw new InvalidOperationError('Location assignment not found');
    }

    const maxFutureMonths = await req.settings.get('locationAssignments.assignmentMaxFutureMonths');
    const maxAssignmentDate = addMonths(new Date(), maxFutureMonths);

    if (isAfter(parseISO(body.date), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `Date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }
    if (body.repeatEndDate && isAfter(parseISO(body.repeatEndDate), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `End date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }

    let result;
    // If the assignment is not repeating
    if (!assignment.templateId) {
      result = await updateNonRepeatingAssignment(req, body, assignment);
    } else {
      if (body.updateAllNextRecords) {
        const maxFutureMonths = await req.settings.get(
          'locationAssignments.assignmentMaxFutureMonths',
        );
        if (differenceInMonths(parseISO(body.repeatEndDate), new Date()) > maxFutureMonths) {
          throw new InvalidOperationError(
            `End date should be within ${maxFutureMonths} months from today`,
          );
        }

        if (differenceInMonths(parseISO(body.date), new Date()) > maxFutureMonths) {
          throw new InvalidOperationError(
            `Date should be within ${maxFutureMonths} months from today`,
          );
        }

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

const deleteLocationAssignmentSchema = z.object({
  deleteAllNextRecords: z
    .string()
    .optional()
    .default('false')
    .transform(value => value.toLowerCase() === 'true'),
});
locationAssignmentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'LocationSchedule');

    const { id } = req.params;
    const { models, db } = req;
    const { LocationAssignment } = models;

    const query = await deleteLocationAssignmentSchema.parseAsync(req.query);

    const assignment = await LocationAssignment.findByPk(id);
    if (!assignment) {
      throw new InvalidOperationError('Location assignment not found');
    }

    if (query.deleteAllNextRecords && !assignment.templateId) {
      throw new InvalidOperationError(
        'Cannot delete future assignments for non-repeating assignments',
      );
    }

    if (query.deleteAllNextRecords) {
      await db.transaction(async () => {
        await deleteSelectedAndFutureAssignments(models, assignment.templateId, assignment.date);
      });
    } else {
      await assignment.destroy();
    }

    res.status(200).send({
      success: true,
    });
  }),
);

const overlappingAssignmentsSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string(),
    locationId: z.string(),
    date: dateCustomValidation,
    startTime: timeCustomValidation,
    endTime: timeCustomValidation,
    repeatEndDate: dateCustomValidation.nullable().optional(),
    repeatFrequency: z.number().int().positive().optional(),
    repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
  })
  .superRefine(customAssignmentValidation);
locationAssignmentsRouter.post(
  '/overlapping-assignments',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('list', 'LocationSchedule');

    const body = await overlappingAssignmentsSchema.parseAsync(req.body);

    const maxFutureMonths = await req.settings.get('locationAssignments.assignmentMaxFutureMonths');
    const maxAssignmentDate = addMonths(new Date(), maxFutureMonths);

    if (isAfter(parseISO(body.date), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `Date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }
    if (body.repeatEndDate && isAfter(parseISO(body.repeatEndDate), maxAssignmentDate)) {
      throw new InvalidOperationError(
        `End date should not be greater than ${toDateString(maxAssignmentDate)}`,
      );
    }

    const excludeAssignmentIds = [];
    if (body.id) {
      const assignment = await models.LocationAssignment.findByPk(body.id);
      const template = await models.LocationAssignmentTemplate.findByPk(assignment.templateId);
      const excludeAssignments = await models.LocationAssignment.findAll({
        where: {
          templateId: template.id,
          date: { [Op.gte]: assignment.date },
        },
      });
      excludeAssignmentIds.push(...excludeAssignments.map(assignment => assignment.id));
    }

    const overlapAssignments = await findOverlappingAssignments(req.models, body, {
      excludeAssignmentIds,
    });

    res.send(overlapAssignments);
  }),
);

const overlappingLeavesSchema = z
  .object({
    userId: z.string(),
    date: dateCustomValidation,
    repeatEndDate: dateCustomValidation.nullable().optional(),
    repeatFrequency: z.coerce.number().int().positive().optional(),
    repeatUnit: z.enum(REPEAT_FREQUENCY_VALUES).optional(),
  })
  .superRefine(customAssignmentValidation);
locationAssignmentsRouter.get(
  '/overlapping-leaves',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'User');

    const { UserLeave } = req.models;

    const query = await overlappingLeavesSchema.parseAsync(req.query);

    let assignmentDates = [query.date];
    if (query.repeatFrequency) {
      assignmentDates = generateFrequencyDates(
        query.date,
        query.repeatEndDate,
        query.repeatFrequency,
        query.repeatUnit,
      );
    }

    const userLeaves = await UserLeave.findAll({
      where: {
        userId: query.userId,
        endDate: { [Op.gte]: assignmentDates[0] },
        startDate: { [Op.lte]: assignmentDates.at(-1) },
      },
      attributes: ['id', 'startDate', 'endDate', 'userId'],
      order: [['startDate', 'ASC']],
    });

    const overlappingLeaves = userLeaves.filter(leave => {
      return assignmentDates.some(date => leave.startDate <= date && date <= leave.endDate);
    });

    res.send(overlappingLeaves);
  }),
);

/**
 * Create a repeating location assignment with template and generate initial assignment
 */
async function createRepeatingLocationAssignment(req, body) {
  const {
    models: { LocationAssignmentTemplate },
    db,
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
    });

    await template.generateRepeatingLocationAssignments();
  });
}

async function createSingleLocationAssignment(req, body) {
  const { LocationAssignment } = req.models;
  const { userId, locationId, date, startTime, endTime } = body;

  await checkUserLeaveStatus(req.models, userId, date);

  await LocationAssignment.create({
    userId,
    locationId,
    date,
    startTime,
    endTime,
  });
}

async function updateNonRepeatingAssignment(req, body, assignment) {
  await checkUserLeaveStatus(req.models, assignment.userId, body.date);

  const overlapAssignments = await findOverlappingAssignments(
    req.models,
    {
      locationId: body.locationId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    },
    {
      excludeAssignmentIds: [assignment.id],
    },
  );

  if (overlapAssignments?.length > 0) {
    return {
      success: false,
      overlapAssignments,
    };
  }

  await assignment.update({
    locationId: body.locationId,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
  });

  return { success: true };
}

async function updateSingleRepeatingAssignment(req, body, assignment) {
  const { models, db } = req;
  const { LocationAssignment } = models;
  let overlapAssignments = [];
  try {
    await db.transaction(async () => {
      await assignment.destroy();

      await checkUserLeaveStatus(req.models, assignment.userId, body.date);

      overlapAssignments = await findOverlappingAssignments(req.models, {
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
      });
    });

    return { success: true };
  } catch (error) {
    if (overlapAssignments?.length > 0) {
      return {
        success: false,
        overlapAssignments,
      };
    }
    throw error;
  }
}

async function updateFutureAssignments(req, body, assignment) {
  const { models, db } = req;
  const { LocationAssignmentTemplate } = models;
  let overlapAssignments = [];

  try {
    await db.transaction(async () => {
      const template = await LocationAssignmentTemplate.findByPk(assignment.templateId);

      await deleteSelectedAndFutureAssignments(models, template.id, assignment.date);
      overlapAssignments = await findOverlappingAssignments(models, body);

      if (overlapAssignments?.length > 0) {
        throw new InvalidOperationError('Location assignment overlaps with existing assignments');
      }

      const newTemplate = await LocationAssignmentTemplate.create({
        userId: template.userId,
        locationId: body.locationId,
        startTime: body.startTime,
        endTime: body.endTime,
        date: body.date,
        repeatEndDate: body.repeatEndDate,
        repeatFrequency: body.repeatFrequency,
        repeatUnit: body.repeatUnit,
      });
      await newTemplate.generateRepeatingLocationAssignments();
    });

    return { success: true };
  } catch (error) {
    if (overlapAssignments?.length > 0) {
      return {
        success: false,
        overlapAssignments,
      };
    }
    throw error;
  }
}

async function deleteSelectedAndFutureAssignments(models, templateId, assignmentDate) {
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
  await LocationAssignmentTemplate.update(
    {
      repeatEndDate: latestAssignment.date,
    },
    {
      where: {
        id: templateId,
      },
    },
  );
}

/**
 * Check if the new assignment overlaps with existing generated assignments.
 */
async function findOverlappingAssignments(models, body, options = {}) {
  const { LocationAssignment, User } = models;
  const {
    locationId,
    date,
    startTime,
    endTime,
    repeatFrequency,
    repeatUnit,
    repeatEndDate,
    userId,
  } = body;

  let dateFilter = {
    [Op.eq]: date,
  };
  if (repeatFrequency) {
    const assignmentDates = generateFrequencyDates(
      date,
      repeatEndDate,
      repeatFrequency,
      repeatUnit,
    );

    dateFilter = {
      [Op.in]: assignmentDates,
    };
  }

  const overlappingAssignments = await LocationAssignment.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'displayName', 'email'],
      },
    ],
    where: {
      locationId,
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
      date: dateFilter,
      ...(options.excludeAssignmentIds && { id: { [Op.notIn]: options.excludeAssignmentIds } }),
      ...(repeatFrequency && {
        [Op.or]: [
          // All records with null templateId
          { templateId: null },
          // First record for each templateId
          {
            templateId: { [Op.ne]: null },
            id: {
              [Op.in]: literal(`(
                SELECT DISTINCT ON ("template_id") id
                FROM "location_assignments"
                WHERE template_id IS NOT NULL
                ${options.excludeAssignmentIds?.length > 0 ? 'AND id NOT IN (:excludeAssignmentIds)' : ''}
                AND date IN (:dates)
                AND NOT EXISTS (SELECT 1 FROM user_leaves WHERE user_id = :userId AND date BETWEEN start_date AND end_date)
                AND location_id = :locationId
                AND deleted_at IS NULL
                ORDER BY template_id, date ASC
              )`),
            },
          },
        ],
      }),
    },
    replacements: {
      dates: dateFilter[Op.in],
      locationId,
      userId,
      ...(options.excludeAssignmentIds?.length > 0 && { excludeAssignmentIds: options.excludeAssignmentIds }),
    },
    attributes: ['id', 'locationId', 'date', 'startTime', 'endTime', 'templateId'],
    order: [
      ['date', 'ASC'],
      ['startTime', 'ASC'],
    ],
  });
  return overlappingAssignments.map(assignment => ({
    id: assignment.id,
    date: assignment.date,
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    locationId: assignment.locationId,
    user: assignment.user,
    templateId: assignment.templateId,
    isRepeating: !!assignment.templateId,
  }));
}

async function checkUserLeaveStatus(models, userId, date) {
  const { UserLeave } = models;
  const userLeave = await UserLeave.findOne({
    where: {
      userId,
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
    },
    attributes: ['id'],
  });

  if (userLeave) {
    throw new InvalidOperationError(`User is on leave!`);
  }
}
