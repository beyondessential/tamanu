export const convertToDbRecord = syncRecord => {
  const { data, hashedPassword, lastSynced, ...metadata } = syncRecord;

  return {
    password: hashedPassword,
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
