export const convertToDbRecord = syncRecord => {
  const { data, lastSynced, ...metadata } = syncRecord;

  return {
    ...metadata,
    ...data,
  };
};

export const convertFromDbRecord = dbRecord => {
  const { id, updatedAt, createdAt, deletedAt, password, ...data } = dbRecord;

  return {
    lastSynced: updatedAt?.valueOf(),
    ...(deletedAt ? { isDeleted: true } : {}),
    data: {
      id,
      ...(deletedAt ? {} : data),
    },
  };
};
