import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { pick } from 'lodash';
import * as yup from 'yup';
import { InvalidOperationError } from '@tamanu/shared/errors';

export const usersRouter = express.Router();

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User },
      },
      query: { order = 'ASC', orderBy = 'displayName', rowsPerPage, page },
    } = req;

    req.checkPermission('list', 'User');

    const users = await User.findAll({
      include: 'facilities',
      order: [[orderBy, order.toUpperCase()]],
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    res.send({
      data: await Promise.all(
        users.map(async user => {
          const allowedFacilities = await user.allowedFacilityIds();
          const obj = user.get({ plain: true });
          return {
            ...pick(obj, ['id', 'displayName', 'email', 'phoneNumber', 'role']),
            allowedFacilities,
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
    email: yup
      .string()
      .email()
      .required(),
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
    const { models, params, body, user: currentUser } = req;
    const { id: userId } = params;
    const { UserLeave } = models;

    req.checkPermission('write', 'User');

    const data = await userLeaveSchema.validate(body);
    const { startDate, endDate } = data;

    if (new Date(startDate) > new Date(endDate)) {
      throw new InvalidOperationError('startDate must be before or equal to endDate');
    }

    // Check for overlapping leaves
    const overlap = await UserLeave.findOne({
      where: {
        userId,
        removedAt: null,
        [Op.and]: [
          { endDate: { [Op.gte]: startDate } },
          { startDate: { [Op.lte]: endDate } },
        ],
      },
    });

    if (overlap) {
      throw new InvalidOperationError('Leave overlaps with an existing leave');
    }

    const leave = await UserLeave.create({
      userId,
      startDate,
      endDate,
      scheduledBy: currentUser.id,
      scheduledAt: getCurrentDateTimeString(),
    });

    res.send(leave);
  })
);

/**
 * Get all leaves for a user
 */
usersRouter.get(
  '/:id/leaves',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { id: userId } = params;

    req.checkPermission('list', 'User');

    let where = { 
      userId,
      removedAt: null
    };

    const leaves = await models.UserLeave.findAll({
      where,
      order: [['startDate', 'ASC']],
    });

    res.send(leaves);
  })
);



