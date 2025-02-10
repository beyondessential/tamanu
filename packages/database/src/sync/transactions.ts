import { Sequelize, Transaction, type TransactionOptions } from 'sequelize';

const wrapTransaction = async <T>(
  sequelize: Sequelize,
  options: TransactionOptions = {},
  // eslint-disable-next-line no-unused-vars
  executeWithinTransaction: (transaction: Transaction) => Promise<T>,
): Promise<T> => {
  return sequelize.transaction(options, async (transaction) => {
    // transaction does not actually start until the first query is executed,
    // so just select 1 here to start the transaction as soon as possible
    await sequelize.query('SELECT 1;', { transaction });
    return executeWithinTransaction(transaction);
  });
};

export const repeatableReadTransaction = async <T>(
  sequelize: Sequelize,
  // eslint-disable-next-line no-unused-vars
  executeWithinTransaction: (transaction: Transaction) => Promise<T>,
): Promise<T> =>
  wrapTransaction(
    sequelize,
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    executeWithinTransaction,
  );

export const readOnlyTransaction = async <T>(
  sequelize: Sequelize,
  // eslint-disable-next-line no-unused-vars
  executeWithinTransaction: (transaction: Transaction) => Promise<T>,
): Promise<T> => {
  return wrapTransaction(sequelize, {}, async (transaction) => {
    // Set the transaction to read-only mode
    await sequelize.query('SET TRANSACTION READ ONLY;', { transaction });
    return executeWithinTransaction(transaction);
  });
};
