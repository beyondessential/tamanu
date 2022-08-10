import { Database } from '~/infra/db';

export const getSyncSessionIndex = async (key: string): Promise<number> => {
  const localSystemFact = await Database.models.LocalSystemFact.findOne({
    key,
  });

  return localSystemFact ? parseInt(localSystemFact.value) : 0;
};
