import { MODELS_MAP } from '../../../models/modelsMap';

export const setSyncSessionSequence = async (
  models: typeof MODELS_MAP,
  index: number,
  key: string,
): Promise<void> => {
  const localSystemFact = await models.LocalSystemFact.findOne({ key });

  if (localSystemFact) {
    localSystemFact.value = index.toString();
    await localSystemFact.save();
    return;
  }

  await models.LocalSystemFact.save({ key, value: index });
};
