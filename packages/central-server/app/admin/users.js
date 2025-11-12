import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { dateCustomValidation, getCurrentDateString } from '@tamanu/utils/dateTime';
import { pick } from 'lodash';
import * as yup from 'yup';
import { REFERENCE_TYPES, VISIBILITY_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import {
  DatabaseDuplicateError,
  NotFoundError,
  ValidationError,
  InvalidOperationError,
  EditConflictError,
} from '@tamanu/errors';
import { isBefore, startOfDay } from 'date-fns';
import { isBcryptHash } from '@tamanu/utils/password';
import { subject } from '@casl/ability';
import z from 'zod';

export const usersRouter = express.Router();

const createUserFilters = (filterParams, models) => {
  const includeDeactivated = filterParams.includeDeactivated !== 'false';
  const filters = [
    // Text search filters
    filterParams.displayName && {
      [Op.or]: [{ displayName: { [Op.iLike]: `%${filterParams.displayName}%` } }],
    },
    filterParams.displayId && {
      displayId: { [Op.iLike]: `%${filterParams.displayId}%` },
    },
    filterParams.email && {
      email: { [Op.iLike]: `%${filterParams.email}%` },
    },
    // Exact match filters
    filterParams.roleId && {
      role: filterParams.roleId,
    },
    // Designation filter
    filterParams.designationId && {
      id: {
        [Op.in]: models.User.sequelize.literal(`(
          SELECT "user_id"
          FROM "user_designations"
          WHERE "designation_id" = ${models.User.sequelize.escape(filterParams.designationId)}
          AND "deleted_at" IS NULL
        )`),
      },
    },
    // Include deactivated users filter
    !includeDeactivated && {
      visibilityStatus: 'current',
    },
    // Exclude system user
    {
      id: { [Op.ne]: SYSTEM_USER_UUID },
    },
  ];

  return filters.filter(f => !!f);
};

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User, UserDesignation, ReferenceData, Role },
      },
      query: { order = 'ASC', orderBy = 'displayName', rowsPerPage, page, ...filterParams },
    } = req;

    req.checkPermission('list', 'User');

    // Create where clause from filters
    const filters = createUserFilters(filterParams, req.store.models);
    const whereClause = filters.length > 0 ? { [Op.and]: filters } : {};
    const userInclude = [
      'facilities',
      {
        model: UserDesignation,
        as: 'designations',
        include: {
          model: ReferenceData,
          as: 'referenceData',
        },
      },
    ];

    // Get total count for pagination
    const count = await User.count({
      where: whereClause,
      include: userInclude,
      distinct: true,
    });

    let orderClause;
    const upperOrder = order.toUpperCase();
    switch (orderBy) {
      case 'roleName':
        orderClause = [
          [
            User.sequelize.literal(
              `(SELECT "name" FROM ${Role.getTableName()} WHERE ${Role.getTableName()}."id" = "User"."role")`,
            ),
            upperOrder,
          ],
        ];
        break;
      case 'designations':
        orderClause = [
          [
            User.sequelize.literal(
              `(SELECT MIN(ref."name") FROM ${UserDesignation.getTableName()} ud
                LEFT JOIN ${ReferenceData.getTableName()} ref ON ud."designation_id" = ref."id"
                WHERE ud."user_id" = "User"."id" AND ud."deleted_at" IS NULL AND ref."deleted_at" IS NULL
                GROUP BY ud."user_id")
              `,
            ),
            upperOrder,
          ],
        ];
        break;
      case 'displayName':
      case 'email':
      case 'phoneNumber':
        orderClause = [[orderBy, upperOrder]];
        break;
      default:
        throw new ValidationError(`Invalid orderBy value: ${orderBy}`);
    }

    const users = await User.findAll({
      where: whereClause,
      include: userInclude,
      order: orderClause,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    // Get role names for each user
    const roleIds = [...new Set(users.map(user => user.role))];
    const roles = await Role.findAll({
      where: { id: roleIds },
    });
    const roleMap = new Map(roles.map(role => [role.id, role.name]));

    res.send({
      count,
      data: await Promise.all(
        users.map(async user => {
          const allowedFacilities = await user.allowedFacilityIds();
          const obj = user.get({ plain: true });
          const designations = user.designations || [];
          const roleName = roleMap.get(user.role) || null;
          return {
            ...pick(obj, [
              'id',
              'displayName',
              'displayId',
              'email',
              'phoneNumber',
              'role',
              'visibilityStatus',
              'facilities',
            ]),
            roleName,
            allowedFacilities,
            designations,
          };
        }),
      ),
    });
  }),
);

const CREATE_VALIDATION = yup
  .object()
  .shape({
    displayName: yup.string().trim().required(),
    displayId: yup.string().trim().nullable().optional(),
    role: yup.string().required(),
    phoneNumber: yup.string().trim().nullable().optional(),
    email: yup.string().trim().email().required(),
    designations: yup.array().of(yup.string()).nullable().optional(),
    password: yup.string().required(),
    allowedFacilityIds: yup.array().of(yup.string()).nullable().optional(),
  })
  .test('password-is-not-hashed', 'Password must not be hashed', function (value) {
    return !isBcryptHash(value.password);
  })
  .noUnknown();

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role, User, ReferenceData, UserDesignation, UserFacility, Facility },
      },
      db,
    } = req;

    req.checkPermission('create', 'User');

    const fields = await CREATE_VALIDATION.validate(req.body);
    const role = await Role.findByPk(fields.role);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const existingUserWithSameEmail = await User.findOne({
      where: {
        email: fields.email,
      },
    });
    if (existingUserWithSameEmail) {
      throw new DatabaseDuplicateError('Email must be unique across all users');
    }

    const existingUserWithSameDisplayName = await User.findOne({
      where: {
        displayName: { [Op.iLike]: fields.displayName },
      },
    });
    if (existingUserWithSameDisplayName) {
      throw new DatabaseDuplicateError('Display name must be unique across all users');
    }

    if (fields.designations && fields.designations.length > 0) {
      // Check if all designation IDs exist and are of type 'designation'
      const existingDesignations = await ReferenceData.findAll({
        where: {
          id: { [Op.in]: fields.designations },
          type: REFERENCE_TYPES.DESIGNATION,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
        attributes: ['id'],
      });

      const existingDesignationIds = existingDesignations.map(d => d.id);
      const invalidDesignationIds = fields.designations.filter(
        id => !existingDesignationIds.includes(id),
      );

      if (invalidDesignationIds.length > 0) {
        throw new ValidationError(`Invalid designation IDs: ${invalidDesignationIds.join(', ')}`);
      }
    }

    if (fields.allowedFacilityIds && fields.allowedFacilityIds.length > 0) {
      const existingFacilities = await Facility.findAll({
        where: {
          id: { [Op.in]: fields.allowedFacilityIds },
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
        attributes: ['id'],
      });

      const existingFacilityIds = existingFacilities.map(f => f.id);
      const invalidFacilityIds = fields.allowedFacilityIds.filter(
        id => !existingFacilityIds.includes(id),
      );

      if (invalidFacilityIds.length > 0) {
        throw new ValidationError(`Invalid facility IDs: ${invalidFacilityIds.join(', ')}`);
      }
    }

    await db.transaction(async () => {
      const user = await User.create(fields);

      // Add new designations
      if (fields.designations && fields.designations.length > 0) {
        const designationRecords = fields.designations.map(designationId => ({
          userId: user.id,
          designationId,
        }));
        await UserDesignation.bulkCreate(designationRecords);
      }

      const uniqueFacilityIds = [...new Set(fields.allowedFacilityIds || [])];
      await UserFacility.bulkCreate(
        uniqueFacilityIds.map(facilityId => ({
          userId: user.id,
          facilityId,
        })),
        {
          ignoreDuplicates: true,
        },
      );
    });

    res.send({ ok: true });
  }),
);

const VALIDATION = yup
  .object()
  .shape({
    displayName: yup.string().trim().required(),
    email: yup.string().trim().email().required(),
    role: yup.string().required(),
  })
  .noUnknown();

usersRouter.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User, Permission },
      },
    } = req;

    // skip permission check as we will use it for both create and update api, and this is safe to do as it's only used for validation
    req.flagPermissionChecked();

    const fields = await VALIDATION.validate(req.body);

    const existingUserWithSameEmail = await User.findOne({
      where: {
        email: fields.email,
      },
    });

    const existingUserWithSameDisplayName = await User.findOne({
      where: {
        displayName: { [Op.iLike]: fields.displayName },
      },
    });

    const writeUserPermission = await Permission.findOne({
      where: {
        roleId: fields.role,
        noun: 'User',
        verb: 'write',
      },
    });

    res.send({
      isEmailUnique: !existingUserWithSameEmail,
      isDisplayNameUnique: !existingUserWithSameDisplayName,
      hasWriteUserPermission: !!writeUserPermission,
    });
  }),
);

const UPDATE_VALIDATION = yup
  .object()
  .shape({
    visibilityStatus: yup
      .string()
      .required()
      .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
    displayName: yup.string().trim().required(),
    displayId: yup.string().trim().nullable().optional(),
    role: yup.string().required(),
    phoneNumber: yup.string().trim().nullable().optional(),
    email: yup.string().trim().email().required(),
    designations: yup.array().of(yup.string()).nullable().optional(),
    newPassword: yup.string().nullable().optional(),
    confirmPassword: yup.string().nullable().optional(),
    allowedFacilityIds: yup.array().of(yup.string()).nullable().optional(),
  })
  .test('passwords-match', 'Passwords must match', function (value) {
    const { newPassword, confirmPassword } = value;
    // If both passwords are provided, they must match
    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
      return this.createError({ message: 'Passwords must match' });
    }
    return true;
  })
  .test('password-is-not-hashed', 'Password must not be hashed', function (value) {
    return !isBcryptHash(value.newPassword);
  })
  .noUnknown();
usersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role, User, UserDesignation, ReferenceData, UserFacility },
      },
      params: { id },
      db,
    } = req;

    const fields = await UPDATE_VALIDATION.validate(req.body);

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    // only allow updating the user if the user has the write permission for the all users
    req.checkPermission('write', subject('User', { id: String(Date.now()) }));

    const role = await Role.findByPk(fields.role);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const existingUserWithSameEmail = await User.findOne({
      where: {
        email: fields.email,
        id: { [Op.ne]: id },
      },
    });
    if (existingUserWithSameEmail) {
      throw new EditConflictError('Email must be unique across all users');
    }

    const existingUserWithSameDisplayName = await User.findOne({
      where: {
        displayName: { [Op.iLike]: fields.displayName },
        id: { [Op.ne]: id },
      },
    });
    if (existingUserWithSameDisplayName) {
      throw new EditConflictError('Display name must be unique across all users');
    }

    // Validate designations if provided
    if (fields.designations && fields.designations.length > 0) {
      // Check if all designation IDs exist and are of type 'designation'
      const existingDesignations = await ReferenceData.findAll({
        where: {
          id: { [Op.in]: fields.designations },
          type: REFERENCE_TYPES.DESIGNATION,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
        attributes: ['id'],
      });

      const existingDesignationIds = existingDesignations.map(d => d.id);
      const invalidDesignationIds = fields.designations.filter(
        id => !existingDesignationIds.includes(id),
      );

      if (invalidDesignationIds.length > 0) {
        throw new ValidationError(`Invalid designation IDs: ${invalidDesignationIds.join(', ')}`);
      }
    }

    const updateFields = {
      displayName: fields.displayName,
      role: fields.role,
      email: fields.email,
      visibilityStatus: fields.visibilityStatus,
      displayId: fields.displayId,
      phoneNumber: fields.phoneNumber,
    };

    // Add password to update fields if provided
    if (fields.newPassword) {
      updateFields.password = fields.newPassword;
    }

    await db.transaction(async () => {
      await user.update(updateFields);
      // Remove existing designations
      await UserDesignation.destroy({
        where: { userId: id },
      });

      // Add new designations
      if (fields.designations && fields.designations.length > 0) {
        const designationRecords = fields.designations.map(designationId => ({
          userId: id,
          designationId,
        }));
        await UserDesignation.bulkCreate(designationRecords);
      }

      const uniqueFacilityIds = [...new Set(fields.allowedFacilityIds || [])];
      await updateUserFacilities(UserFacility, user, uniqueFacilityIds);
    });

    res.send({ ok: true });
  }),
);

const userLeaveSchema = yup.object().shape({
  startDate: yup.string().min(1, 'startDate is required').required(),
  endDate: yup.string().min(1, 'endDate is required').required(),
  force: yup.boolean().optional(),
});
// POST /:id/leave - Create leave for a user
usersRouter.post(
  '/:id/leaves',
  asyncHandler(async (req, res) => {
    const { models, params, body, db } = req;
    const { id: userId } = params;
    const { UserLeave, LocationAssignment } = models;

    // only allow updating the user if the user has the write permission for the all users
    req.checkPermission('write', subject('User', { id: String(Date.now()) }));

    const data = await userLeaveSchema.validate(body);
    const { startDate, endDate } = data;

    const parsedEndDate = startOfDay(new Date(endDate));
    const currentDate = startOfDay(new Date());

    if (isBefore(parsedEndDate, currentDate)) {
      throw new InvalidOperationError('Cannot create leave in the past');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new InvalidOperationError('startDate must be before or equal to endDate');
    }

    const leave = await db.transaction(async () => {
      // Check for overlapping leaves
      const overlap = await UserLeave.findOne({
        where: {
          userId,
          endDate: { [Op.gte]: startDate },
          startDate: { [Op.lte]: endDate },
        },
      });

      if (overlap) {
        throw new InvalidOperationError('Leave overlaps with an existing leave');
      }

      const leave = await UserLeave.create({
        userId,
        startDate,
        endDate,
      });

      await LocationAssignment.destroy({
        where: {
          userId,
          date: { [Op.between]: [startDate, endDate] },
        },
      });

      return leave;
    });

    res.send(leave);
  }),
);

/**
 * Get all leaves for a user
 * If all is false, only upcoming leaves are returned
 */
usersRouter.get(
  '/:id/leaves',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { id: userId } = params;

    const user = await models.User.findByPk(userId);
    req.checkPermission('read', user);

    let where = {
      userId,
    };

    if (query.all !== 'true') {
      where.endDate = {
        [Op.gte]: getCurrentDateString(),
      };
    }

    const leaves = await models.UserLeave.findAll({
      where,
      order: [['startDate', 'ASC']],
    });

    res.send(leaves);
  }),
);

usersRouter.delete(
  '/:id/leaves/:leaveId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { id: userId, leaveId } = params;

    // only allow updating the user if the user has the write permission for the all users
    req.checkPermission('write', subject('User', { id: String(Date.now()) }));

    const leave = await models.UserLeave.findOne({
      where: { id: leaveId, userId },
    });

    if (!leave) {
      throw new NotFoundError('Leave not found');
    }

    // Delete the leave instead of marking it as removed
    await leave.destroy();

    res.send(leave);
  }),
);

const getConflictingLocationAssignmentsSchema = z.object({
  after: dateCustomValidation,
  before: dateCustomValidation,
});
usersRouter.get(
  '/:id/conflicting-location-assignments',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { id: userId } = params;

    const query = await getConflictingLocationAssignmentsSchema.parseAsync(req.query);
    const { after, before } = query;

    req.checkPermission('write', subject('User', { id: String(Date.now()) }));

    const { LocationAssignment, User } = models;

    // Find location assignments that overlap with the leave period
    const conflictingAssignments = await LocationAssignment.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id'],
        },
      ],
      where: {
        userId,
        date: {
          [Op.gte]: after,
          [Op.lte]: before,
        },
      },
      attributes: ['id'],
    });

    res.send({ data: conflictingAssignments });
  }),
);

async function updateUserFacilities(UserFacility, user, allowedFacilityIds) {
  if (allowedFacilityIds.length === 0) {
    return await UserFacility.destroy({
      where: {
        userId: user.id,
      },
    });
  }

  await UserFacility.restore({
    where: {
      userId: user.id,
      facilityId: { [Op.in]: allowedFacilityIds },
    },
  });

  await UserFacility.bulkCreate(
    allowedFacilityIds.map(facilityId => ({
      userId: user.id,
      facilityId,
    })),
    {
      ignoreDuplicates: true,
    },
  );

  await UserFacility.destroy({
    where: {
      userId: user.id,
      facilityId: { [Op.notIn]: allowedFacilityIds },
    },
  });
}
