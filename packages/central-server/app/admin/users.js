import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { getCurrentDateTimeString, getCurrentDateString } from '@tamanu/utils/dateTime';
import { pick } from 'lodash';
import * as yup from 'yup';
import { REFERENCE_TYPES, VISIBILITY_STATUSES, SYSTEM_USER_UUID } from '@tamanu/constants';
import {
  ResourceConflictError,
  NotFoundError,
  ValidationError,
  InvalidOperationError,
} from '@tamanu/shared/errors';
import { isBefore, startOfDay } from 'date-fns';

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
            { model: UserDesignation, as: 'designations' },
            { model: ReferenceData, as: 'referenceData' },
            'name',
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
      subQuery: false,
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

const VALIDATION = yup
  .object()
  .shape({
    displayName: yup.string().required(),
    role: yup.string().required(),
    displayId: yup.string(),
    phoneNumber: yup.string(),
    password: yup.string().required(),
    email: yup.string().email().required(),
  })
  .noUnknown();

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role, User },
      },
    } = req;

    req.checkPermission('create', 'User');

    const fields = await VALIDATION.validate(req.body);
    const role = await Role.findByPk(fields.role);
    if (!role) {
      throw new Error('Role not found');
    }

    await User.create(fields);

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
    const { models, params, body, user: currentUser, db } = req;
    const { id: userId } = params;
    const { UserLeave, LocationAssignment } = models;

    req.checkPermission('write', currentUser);

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

    const user = await models.User.findByPk(userId);

    req.checkPermission('write', user);

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
  })
  .test('passwords-match', 'Passwords must match', function (value) {
    const { newPassword, confirmPassword } = value;
    // If both passwords are provided, they must match
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return this.createError({ message: 'Passwords must match' });
    }
    // If only one password is provided, it's an error
    if ((newPassword && !confirmPassword) || (!newPassword && confirmPassword)) {
      return this.createError({ message: 'Both password fields must be filled' });
    }
    return true;
  })
  .noUnknown();
usersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role, User, UserDesignation, ReferenceData },
      },
      params: { id },
      db,
    } = req;

    const fields = await UPDATE_VALIDATION.validate(req.body);

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    req.checkPermission('write', user);

    const role = await Role.findByPk(fields.role);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if email is unique (excluding current user)
    if (fields.email) {
      const existingUser = await User.findOne({
        where: {
          email: fields.email,
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        throw new ResourceConflictError('Email must be unique across all users');
      }
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
    if (fields.newPassword && fields.confirmPassword) {
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
    });

    res.send({ ok: true });
  }),
);
