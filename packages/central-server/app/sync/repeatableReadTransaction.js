import { Transaction } from 'sequelize';

export const repeatableReadTransaction = async (sequelize, executeWithinTransaction) => {
  await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async transaction => {
      // transaction does not actually start until the first query is executed,
      // so just select 1 here tp start the transaction as soon as possible
      await sequelize.query(`
        SELECT 1; 
      `);

      await executeWithinTransaction(transaction);
    },
  );
};
