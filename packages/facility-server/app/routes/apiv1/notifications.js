import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';
import { NOTIFICATION_STATUSES } from '@tamanu/constants';
import { Op, Sequelize } from 'sequelize';
import { toCountryDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import { sub } from 'date-fns';

export const notifications = express.Router();

notifications.get(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models, user } = req;

    const RECENT_NOTIFICATION_TIME_FRAME = 48; // hours
    const readNotifications = await models.Notification.findAll({
      where: {
        userId: user.id,
        status: NOTIFICATION_STATUSES.READ,
        createdTime: {
          [Op.gte]: toCountryDateTimeString(
            sub(new Date(), { hours: RECENT_NOTIFICATION_TIME_FRAME }),
          ),
        },
      },
      include: models.Notification.getFullReferenceAssociations(),
      order: [
        ['createdTime', 'DESC'],
        [Sequelize.literal(`"patient"."first_name"`), 'ASC'],
      ],
    });

    const unreadNotifications = await models.Notification.findAll({
      where: {
        userId: user.id,
        status: NOTIFICATION_STATUSES.UNREAD,
      },
      include: models.Notification.getFullReferenceAssociations(),
      order: [
        ['createdTime', 'DESC'],
        [Sequelize.literal(`LOWER("patient"."first_name")`), 'ASC'],
      ],
    });

    res.json({ readNotifications, unreadNotifications });
  }),
);

notifications.put(
  '/markAsRead/:id',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { params, models, user } = req;
    const { id } = params;

    const notification = await models.Notification.findOne({ where: { id, userId: user.id } });
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await models.Notification.update({ status: NOTIFICATION_STATUSES.READ }, { where: { id } });
    res.status(204).json();
  }),
);

notifications.put(
  '/markAllAsRead',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models, user } = req;

    await models.Notification.update(
      { status: NOTIFICATION_STATUSES.READ },
      { where: { userId: user.id } },
    );
    res.status(204).json();
  }),
);
