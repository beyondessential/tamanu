import { Op, Sequelize } from 'sequelize';
import { LOGIN_ATTEMPT_OUTCOMES, SETTING_KEYS } from '@tamanu/constants';

export async function checkIsUserLockedOut({
  models: { UserLoginAttempt },
  settings,
  userId,
  deviceId,
}) {
  const { lockoutDuration } = settings.get(SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS);

  const lockedAttempt = await UserLoginAttempt.findOne({
    where: {
      userId,
      deviceId,
      outcome: LOGIN_ATTEMPT_OUTCOMES.LOCKED,
      createdAt: {
        [Op.gte]: Sequelize.literal("CURRENT_TIMESTAMP - interval '$lockoutDuration minutes'"),
      },
    },
    order: [['createdAt', 'DESC']],
    bind: {
      lockoutDuration,
    },
  });

  return !!lockedAttempt;
}
