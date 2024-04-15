import { Op } from 'sequelize';

async function getIds(options) {
  let ids = options.where?.id?.[Op.in];

  // options.where.attribute.val.col
  // .logic[Op.LIKE]
  if (ids) {
    return ids;
  }

  const encounters = await options.model.findAll(options);
  return encounters.map(x => x.id);
}

function getDependantAssociations(model) {
  return Object.values(model.associations).filter(
    ({ associationType }) => associationType === 'HasMany' || associationType === 'HasOne',
  );
}

export async function genericBeforeDestroy(instance) {
  const dependantAssociations = getDependantAssociations(instance.constructor);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: instance.id } });
  }
}

export async function genericBeforeBulkDestroy(options) {
  const ids = await getIds(options);
  const dependantAssociations = getDependantAssociations(options.model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: { [Op.in]: ids } } });
  }
}
