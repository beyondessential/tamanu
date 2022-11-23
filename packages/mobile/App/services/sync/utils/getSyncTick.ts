import { BaseModel } from '~/models/BaseModel';
import { LocalSystemFact } from '~/models/LocalSystemFact';

export const getSyncTick = async (
  models: Record<string, typeof BaseModel>,
  key: string,
): Promise<number> => {
  const localSystemFact = (await models.LocalSystemFact.findOne({
    where: { key },
  })) as LocalSystemFact;

  return localSystemFact ? parseInt(localSystemFact.value, 10) : -1;
};
