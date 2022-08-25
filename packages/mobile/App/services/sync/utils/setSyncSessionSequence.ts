export const setSyncSessionSequence = async (models, index, key) => {
  const localSystemFact = await models.LocalSystemFact.findOne({ key });

  if (localSystemFact) {
    localSystemFact.value = index;
    await localSystemFact.save();
    return;
  }

  await models.LocalSystemFact.save({ key, value: index });
};
