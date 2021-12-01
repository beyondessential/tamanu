export async function migrate(store, options) {
  await store.sequelize.migrate(options);
  process.exit(0);
}
