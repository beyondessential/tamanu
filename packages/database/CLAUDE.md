# Database Package - Development Guidelines

This file contains patterns and conventions for the database package that should be followed when making changes.

## Migration Patterns

### Never Mix DDL and DML in the Same Migration

**Problem:** PostgreSQL uses deferred constraint triggers for audit logging. When you UPDATE a table, trigger events are queued to fire at transaction commit. If you then try to ALTER TABLE (add/remove columns) in the same transaction, PostgreSQL throws:

```
error: cannot ALTER TABLE "table_name" because it has pending trigger events
```

**Solution:** Split migrations that need to both modify data and change schema into separate files:

1. **DDL Migration** - Schema changes only (addColumn, removeColumn, changeColumn)
2. **DML Migration** - Data changes only (UPDATE, INSERT, DELETE)
3. **DDL Migration** - Any remaining schema changes

**Example:** Renaming/transforming a column:

```
1766100000000-addNewColumn.ts        (DDL: add the new column)
1766100000001-migrateData.ts         (DML: UPDATE to copy/transform data)
1766100000002-dropOldColumn.ts       (DDL: remove the old column)
```

Each migration runs in its own transaction, so trigger events are processed between migrations.

**Bad - will fail:**
```typescript
// Single migration - DON'T DO THIS
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'new_column', { type: DataTypes.TEXT });
  await query.sequelize.query(`UPDATE users SET new_column = old_column`);
  await query.removeColumn('users', 'old_column'); // FAILS: pending trigger events
}
```

**Good - split into separate files:**
```typescript
// Migration 1: addNewColumn.ts
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'new_column', { type: DataTypes.TEXT });
}

// Migration 2: migrateData.ts
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`UPDATE users SET new_column = old_column`);
}

// Migration 3: dropOldColumn.ts
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'old_column');
}
```
