import { LocalSystemFact } from '../../../models/LocalSystemFact';

export const getSyncSessionIndex = async (
  key: string,
): Promise<number> => {
  const localSystemFact = await LocalSystemFact.findOne({
    key,
  });

  return localSystemFact ? parseInt(localSystemFact.key) : 0;
};
