export const filterModelsFromName = (models, tablesToInclude) =>
  Object.fromEntries(
    Object.entries(models).filter(
      ([, m]) => tablesToInclude.includes(m.tableName) && m.usesPublicSchema,
    ),
  );
