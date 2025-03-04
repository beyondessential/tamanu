import type { Sequelize } from 'sequelize';
import { AUDIT_PAUSE_KEY } from '@tamanu/constants/audit';

// Applies to current transaction
export const pauseAudit = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.query(`SELECT set_config('${AUDIT_PAUSE_KEY}', 'true', true)`);
}
