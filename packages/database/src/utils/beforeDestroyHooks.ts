import { Op, Sequelize, type DestroyOptions } from 'sequelize';
import { getDependentAssociations } from './getDependentAssociations';
import type { Model } from '../models/Model';

async function getIds(options: DestroyOptions) {
  const ids = (options.where as Record<string, any>)?.id?.[Op.in];

  if (ids) {
    return ids;
  }

  const instances = await options.model?.findAll(options);
  return instances?.map((x) => ('id' in x ? x.id : undefined));
}

async function executeInsideTransaction(
  sequelize: Sequelize,
  arg: Model | DestroyOptions,
  fn: Function,
) {
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
  for (const association of dependantAssociations) {
    const { target, foreignKey } = association;
    await target.destroy({ where: { [foreignKey]: instance.id } });
  }
}

async function beforeBulkDestroy(options: DestroyOptions) {
  const ids = await getIds(options);
  if (ids?.length === 0) {
    return;
  }

  const dependantAssociations = getDependentAssociations(options.model!);

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
  const { sequelize } = options.model!;
  await executeInsideTransaction(sequelize!, options, beforeBulkDestroy);
}
