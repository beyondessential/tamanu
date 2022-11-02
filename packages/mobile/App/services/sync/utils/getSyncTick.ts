import { Database } from '../../../infra/db';

export const getSyncTick = async (key: string): Promise<number> => {
  const localSystemFact = await Database.models.LocalSystemFact.findOne({
    key,
  });

  return localSystemFact ? parseInt(localSystemFact.value, 10) : 0;
};
