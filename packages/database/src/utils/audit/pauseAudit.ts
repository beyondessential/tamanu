import { AUDIT_PAUSE_KEY } from "@tamanu/constants";
import type { Sequelize } from "sequelize";

export const pauseAudit = async (sequelize: Sequelize) => {
  await sequelize.setTransactionVar(AUDIT_PAUSE_KEY, true);
}