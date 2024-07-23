const TABLES_TO_EXCLUDE = ['notes'];

// Some models from mobile have a different sync direction config
// so we remove them here to save some time before snapshotting in central.
// Note this is only needed for outgoing stuff from central.
export const getMobileFilteredModels = (models, isMobile) => {
  // No need to filter anything
  if (isMobile === false) {
    return models;
  }

  const filterTables = model => {
    return TABLES_TO_EXCLUDE.includes(model.tableName) === false;
  };

  return Object.fromEntries(
    Object.entries(models).filter(([, model]) => filterTables(model)),
  );
};
