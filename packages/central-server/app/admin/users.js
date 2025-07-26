import express from 'express';
import asyncHandler from 'express-async-handler';
import { pick } from 'lodash';
import * as yup from 'yup';
import { Op } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export const usersRouter = express.Router();

const createUserFilters = (filterParams, models) => {
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
    // Exclude deactivated users filter
    filterParams.excludeDeactivated === true && {
      visibilityStatus: 'current',
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

    const users = await User.findAll({
      where: whereClause,
      include: userInclude,
      order: [[orderBy, order.toUpperCase()]],
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

const UPDATE_VALIDATION = yup
  .object()
  .shape({
    visibilityStatus: yup
      .string()
      .required()
      .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
    displayName: yup.string().required(),
    displayId: yup.string().nullable().optional(),
    role: yup.string().required(),
    phoneNumber: yup.string().nullable().optional(),
    email: yup.string().email().required(),
    designations: yup.array().of(yup.string()).nullable().optional(),
  })
  .noUnknown();
usersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role, User, UserDesignation },
      },
      params: { id },
      db,
    } = req;

    req.checkPermission('write', 'User');

    const fields = await UPDATE_VALIDATION.validate(req.body);

    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findByPk(fields.role);
    if (!role) {
      throw new Error('Role not found');
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
        throw new Error('Email must be unique across all users');
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
