import { MODELS_MAP } from '../../../models/modelsMap';

export const setSyncSessionSequence = async (
  models: typeof MODELS_MAP,
  syncTick: number,
  key: string,
): Promise<void> => {
  const localSystemFact = await models.LocalSystemFact.findOne({ key });

  if (localSystemFact) {
    localSystemFact.value = syncTick.toString();
    await localSystemFact.save();
    return;
  }

  await models.LocalSystemFact.insert({ key, value: syncTick.toString() });
};
