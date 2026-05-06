import { AUDIT_PAUSE_KEY } from '@tamanu/constants';
import type { Sequelize } from 'sequelize';

/** Sets the audit pause key on the current Sequelize transaction/session. */
export const pauseAudit = async (sequelize: Sequelize) => {
  await sequelize.setTransactionVar(AUDIT_PAUSE_KEY, true);
};
