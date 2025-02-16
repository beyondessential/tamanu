type DbRecord = {
  id: string;
  deletedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  updatedAtSyncTick: string;
  password: string;
  [key: string]: any;
};

type ConvertedDbRecord = {
  data: {
    id: string;
    [key: string]: any; // to allow other properties
  };
  isDeleted?: boolean;
};

const mapRelations = (
  data: object,
  // eslint-disable-next-line no-unused-vars
  f: (value: DbRecord, index: number, array: DbRecord[]) => any,
): object => {
  const relations = {};
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      relations[key] = value.map(f);
    }
  });
  return { ...data, ...relations };
};

export const convertFromDbRecord = (dbRecord: DbRecord): ConvertedDbRecord => {
  const { id, deletedAt, ...data } = dbRecord;
  delete data.updatedAt;
  delete data.createdAt;
  delete data.updatedAtSyncTick;
  delete data.password;

  return {
    ...(deletedAt ? { isDeleted: true } : {}),
    data: {
      id,
      ...(deletedAt ? {} : mapRelations(data, convertFromDbRecord)),
    },
  };
};
