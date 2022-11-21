import { MODELS_MAP } from '../../../models/modelsMap';

export const setSyncTick = async (
  models: typeof MODELS_MAP,
  key: string,
  syncTick: number,
): Promise<void> => {
  const localSystemFact = await models.LocalSystemFact.findOne({ key });

  if (localSystemFact) {
    localSystemFact.value = syncTick.toString();
    await localSystemFact.save();
    return;
  }

  await models.LocalSystemFact.insert({ key, value: syncTick.toString() });
};
