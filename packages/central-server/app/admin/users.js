import express from 'express';
import asyncHandler from 'express-async-handler';
import { pick } from 'lodash';
import * as yup from 'yup';

export const usersRouter = express.Router();

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User, UserDesignation, ReferenceData, Role },
      },
      query: { order = 'ASC', orderBy = 'displayName', rowsPerPage, page },
    } = req;

    req.checkPermission('list', 'User');

    const users = await User.findAll({
      include: [
        'facilities',
        {
          model: UserDesignation,
          as: 'designations',
          include: {
            model: ReferenceData,
            as: 'referenceData',
          },
        },
      ],
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
      data: await Promise.all(
        users.map(async user => {
          const allowedFacilities = await user.allowedFacilityIds();
          const obj = user.get({ plain: true });
          const designations =
            user.designations?.map(d => d.referenceData?.name).filter(Boolean) || [];
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
