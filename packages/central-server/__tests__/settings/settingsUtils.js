export async function createSetting(models, key, value, scope, facilityId) {
  const setting = await models.Setting.create({
    key,
    value,
    scope,
    facilityId,
  });
  return setting;
}
