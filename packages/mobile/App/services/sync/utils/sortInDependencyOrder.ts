import { getManager } from 'typeorm';

import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';

type DependencyMap = {
  [tableName: string]: string[];
};

/**
 * Get dependency map of models
 * ie:
 * {
 *  'SurveyScreenComponent': ['SurveyScreen', 'ProgramDataElement'],
 *  ....
 * }
 * @returns
 */
const getDependencyMap = async (models: typeof MODELS_MAP): Promise<DependencyMap> => {
  const entityManager = getManager();
  const dependencyMap = {};
  const tableNameToModelName = getTableNameToModelName(models);

  for (const [modelName, model] of Object.entries(models)) {
    if (!dependencyMap[modelName]) {
      dependencyMap[modelName] = [];
    }
    const dependencies = await entityManager.query(
      `PRAGMA foreign_key_list(${model.getRepository().metadata.tableName})`,
    );
    dependencyMap[modelName] = dependencies.map(d => tableNameToModelName[d.table]);
  }

  return dependencyMap;
};

/**
 * Get a map of all table names to model names
 * ie:
 * {
 *  'reference_data': 'ReferenceData',
 *  'survey': 'Survey',
 *  ....
 * }
 * @param models
 * @returns
 */
const getTableNameToModelName = (models: typeof MODELS_MAP): { [key: string]: string } => {
  const tableNameToModelName = {};

  Object.values(models).forEach(model => {
    const tableName = model.getRepository().metadata.tableName;
    const modelName = model.name;
    tableNameToModelName[tableName] = modelName;
  });

  return tableNameToModelName;
};

/**
 * Sort the models in order of persist based on foreign keys so
 * that they are imported in the right order
 * @param models
 * @returns
 */
export const sortInDependencyOrder = async (
  models: typeof MODELS_MAP,
): Promise<typeof BaseModel[]> => {
  const dependencyMap = await getDependencyMap(models);
  const sorted = [];
  const stillToSort = { ...models };

  while (Object.keys(stillToSort).length > 0) {
    Object.values(stillToSort).forEach(model => {
      const modelName = model.name;
      const dependsOn = dependencyMap[modelName] || [];
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort[d]);

      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        delete stillToSort[modelName];
      }
    });
  }

  return sorted;
};
