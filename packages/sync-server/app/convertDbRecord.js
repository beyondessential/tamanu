export const convertToDbRecord = syncRecord => {
  // TODO: recursively run conversion for nested arrays and add tests
  const { data, lastSynced, ...metadata } = syncRecord;

  return {
    ...metadata,
    ...data,
  };
};

const convertDbRelations = data => {
  const relations = {};
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      relations[key] = value.map(convertFromDbRecord);
    }
  });
  return { ...data, ...relations };
};

export const convertFromDbRecord = dbRecord => {
  const { id, updatedAt, createdAt, deletedAt, password, ...data } = dbRecord;

  return {
    lastSynced: updatedAt?.valueOf(),
    ...(deletedAt ? { isDeleted: true } : {}),
    data: {
      id,
      ...(deletedAt ? {} : convertDbRelations(data)),
    },
  };
};
