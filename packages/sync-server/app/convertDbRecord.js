const mapRelations = (data, f) => {
  const relations = {};
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      relations[key] = value.map(f);
    }
  });
  return { ...data, ...relations };
};

export const convertToDbRecord = syncRecord => {
  const { data, ...metadata } = syncRecord;
  return {
    ...metadata,
    ...mapRelations(data, convertToDbRecord),
  };
};

export const convertFromDbRecord = dbRecord => {
  const { id, updatedAt, createdAt, deletedAt, updatedAtSyncTick, password, ...data } = dbRecord;

  return {
    data: {
      id,
      ...(deletedAt ? {} : mapRelations(data, convertFromDbRecord)),
    },
  };
};
