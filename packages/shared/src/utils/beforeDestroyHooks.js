import { Op } from 'sequelize';

async function getIds(options) {
  let ids = options.where?.id?.[Op.in];

  if (ids) {
    return ids;
  }

  const instances = await options.model.findAll(options);
  return instances.map(x => x.id);
}

function getDependantAssociations(model) {
  return Object.values(model.associations).filter(
    ({ associationType }) => ['HasMany', 'HasOne'].includes(associationType),
  );
}

async function executeInsideTransaction(sequelize, arg, fn) {
  if (sequelize.isInsideTransaction()) {
    await fn(arg);
    return;
  }
  await sequelize.transaction(async () => {
    await fn(arg);
  });
}

async function beforeDestroy(instance) {
  const dependantAssociations = getDependantAssociations(instance.constructor);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: instance.id } });
  }
}

async function beforeBulkDestroy(options) {
  const ids = await getIds(options);
  if (ids.length === 0) {
    return;
  }

  const dependantAssociations = getDependantAssociations(options.model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: { [Op.in]: ids } } });
  }
}

export async function genericBeforeDestroy(instance) {
  const { sequelize } = instance;
  await executeInsideTransaction(sequelize, instance, beforeDestroy);
}

export async function genericBeforeBulkDestroy(options) {
  const { sequelize } = options.model;
  await executeInsideTransaction(sequelize, options, beforeBulkDestroy);
}
