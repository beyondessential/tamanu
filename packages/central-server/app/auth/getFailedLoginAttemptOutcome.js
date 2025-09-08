import { Op, Sequelize } from 'sequelize';
import { LOGIN_ATTEMPT_OUTCOMES, SETTING_KEYS } from '@tamanu/constants';

export async function getFailedLoginAttemptOutcome({
  models: { UserLoginAttempt },
  settings,
  userId,
  deviceId,
}) {
  const {
    lockoutThreshold,
    observationWindow,
  } = settings.get(SETTING_KEYS.SECURITY_LOGIN_ATTEMPTS);

  const failedAttempts = await UserLoginAttempt.count({
    where: {
      userId,
      deviceId,
      outcome: LOGIN_ATTEMPT_OUTCOMES.FAILED,
      createdAt: {
        [Op.gte]: Sequelize.literal("CURRENT_TIMESTAMP - interval '$observationWindow minutes'"),
      },
    },
    order: [['createdAt', 'DESC']],
    bind: {
      observationWindow,
    },
  });

  if (failedAttempts >= lockoutThreshold) {
    return LOGIN_ATTEMPT_OUTCOMES.LOCKED;
  }

  return LOGIN_ATTEMPT_OUTCOMES.FAILED;
}
