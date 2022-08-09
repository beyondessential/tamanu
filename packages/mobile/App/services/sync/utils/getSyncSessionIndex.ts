import { Database } from '~/infra/db';

export const getSyncSessionIndex = async key => {
  const localSystemFact = await Database.models.LocalSystemFact.findOne({
    key,
  });

  return parseInt(localSystemFact?.key) || 0;
};
