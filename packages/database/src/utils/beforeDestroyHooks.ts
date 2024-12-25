import { Model, Op, Sequelize, type DestroyOptions } from 'sequelize';
import { getDependentAssociations } from './getDependentAssociations';

async function getIds(options: DestroyOptions) {
  const ids = (options.where as { id?: { [Op.in]?: any[] } })?.id?.[Op.in];

  if (ids) {
    return ids;
  }

  const instances = await (options.model as any)?.findAll(options);
  return instances?.map((x: any) => x.id);
}

async function executeInsideTransaction(sequelize: Sequelize, arg: Model | DestroyOptions, fn: Function) {
  if (sequelize.isInsideTransaction()) {
    await fn(arg);
    return;
  }
  await sequelize.transaction(async () => {
    await fn(arg);
  });
}

async function beforeDestroy(instance: Model) {
  const dependantAssociations = getDependentAssociations(instance.constructor as typeof Model);
  Model.associations['aa']
  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: instance.dataValues.id } });
  }
}

async function beforeBulkDestroy(options: DestroyOptions) {
  const ids = await getIds(options);
  if (ids?.length === 0) {
    return;
  }

  const dependantAssociations = getDependentAssociations(options.model as typeof Model);

  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: { [Op.in]: ids } } });
  }
}

export async function genericBeforeDestroy(instance: Model) {
  const { sequelize } = instance;
  await executeInsideTransaction(sequelize, instance, beforeDestroy);
}

export async function genericBeforeBulkDestroy(options: DestroyOptions) {
  const sequelize = options.model?.sequelize;
  await executeInsideTransaction(sequelize!, options, beforeBulkDestroy);
}
