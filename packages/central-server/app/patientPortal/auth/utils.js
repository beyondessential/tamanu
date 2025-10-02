export const findPortalUserById = async (models, portalUserId) => {
  return await models.PortalUser.findByPk(portalUserId);
};
