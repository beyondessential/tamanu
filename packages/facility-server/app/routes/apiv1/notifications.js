import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/errors';
import { NOTIFICATION_STATUSES } from '@tamanu/constants';
import { Op, Sequelize } from 'sequelize';
import { toCountryDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import { sub } from 'date-fns';

export const notifications = express.Router();

notifications.get(
  '/',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models, user, settings, query } = req;
    const facilityId = query.facilityId;

    const recentNotificationsTimeFrame =
      (await settings[facilityId]?.get('notifications.recentNotificationsTimeFrame')) || 48;

    const readNotifications = await models.Notification.findAll({
      where: {
        userId: user.id,
        status: NOTIFICATION_STATUSES.READ,
        createdTime: {
          [Op.gte]: toCountryDateTimeString(
            sub(new Date(), { hours: recentNotificationsTimeFrame }),
          ),
        },
      },
      include: models.Notification.getFullReferenceAssociations(),
      order: [
        ['createdTime', 'DESC'],
        [
          Sequelize.fn(
            'concat',
            Sequelize.fn('LOWER', Sequelize.col('patient.first_name')),
            ' ',
            Sequelize.fn('LOWER', Sequelize.col('patient.last_name')),
          ),
          'ASC',
        ],
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
        [
          Sequelize.fn(
            'concat',
            Sequelize.fn('LOWER', Sequelize.col('patient.first_name')),
            ' ',
            Sequelize.fn('LOWER', Sequelize.col('patient.last_name')),
          ),
          'ASC',
        ],
      ],
    });

    res.json({ readNotifications, unreadNotifications, recentNotificationsTimeFrame });
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

    await notification.update({ status: NOTIFICATION_STATUSES.READ });
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
      { where: { userId: user.id, status: NOTIFICATION_STATUSES.UNREAD } },
    );
    res.status(204).json();
  }),
);
