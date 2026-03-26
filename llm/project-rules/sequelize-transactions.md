# Sequelize Transactions - Tamanu

This file describes how transactions are used in the Tamanu codebase so that AI assistants and developers follow the same patterns.

## Use Managed Transactions

Use **managed transactions**: wrap all transaction logic inside a single `sequelize.transaction(async () => { ... })` block. Do not manually create a transaction and then commit/rollback yourself.

**Preferred:**
```javascript
await sequelize.transaction(async () => {
  await Model.create(data);
  await OtherModel.update(updates, { where: { id } });
  // ... more work
});
```

**Avoid:** Unmanaged transactions (manually calling `transaction.commit()` / `transaction.rollback()`), unless there is a specific reason.

## Do Not Pass the Transaction Object

**Do not pass the `transaction` object** into Sequelize calls (e.g. `create`, `update`, `findByPk`, `findAll`) that run inside the transaction callback.

The project uses **Sequelize.useCLS()** (configured in `packages/database/src/services/database.js`). CLS (Continuation Local Storage) binds the current transaction to the async context, so any Sequelize call made within the transaction callback automatically runs in that transaction. Passing `{ transaction }` is unnecessary and is not the preferred style in this codebase.

**Preferred:**
```javascript
await sequelize.transaction(async () => {
  const record = await Model.create(data);        // no { transaction }
  await OtherModel.update(updates, { where });   // no { transaction }
});
```

**Avoid:**
```javascript
await sequelize.transaction(async (t) => {
  const record = await Model.create(data, { transaction: t });
  await OtherModel.update(updates, { where, transaction: t });
});
```

When suggesting or writing transaction code, use the managed form and omit the transaction option from inner Sequelize calls.
