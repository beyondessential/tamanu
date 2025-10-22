import { getManager } from 'typeorm';

import { ArrayOfModels, MODELS_MAP } from '../../../models/modelsMap';

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
const getDependencyMap = async (models: Partial<typeof MODELS_MAP>): Promise<DependencyMap> => {
  const entityManager = getManager();
  const dependencyMap = {};
  const tableNameToModelName = getTableNameToModelName(models);

  for (const [modelName, model] of Object.entries(models)) {
    if (!dependencyMap[modelName]) {
      dependencyMap[modelName] = [];
    }
    const dependencies = await entityManager.query(
      `PRAGMA foreign_key_list(${(model as any).getRepository().metadata.tableName})`,
    );
    dependencyMap[modelName] = dependencies.map((d) => tableNameToModelName[d.table]);
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
const getTableNameToModelName = (models: Partial<typeof MODELS_MAP>): { [key: string]: string } => {
  const tableNameToModelName = {};

  Object.values(models).forEach((model) => {
    const tableName = (model as any).getRepository().metadata.tableName;
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
  models: Partial<typeof MODELS_MAP>,
): Promise<ArrayOfModels> => {
  const dependencyMap = await getDependencyMap(models);
  const sorted: ArrayOfModels = [];
  const stillToSort = { ...models };

  while (Object.keys(stillToSort).length > 0) {
    Object.values(stillToSort).forEach((model) => {
      const modelName = model.name;
      // filter out self to avoid circular dependencies
      const dependsOn = dependencyMap[modelName]?.filter(d => d !== modelName) || [];
      const dependenciesStillToSort = dependsOn.filter((d) => !!stillToSort[d]);

      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        delete stillToSort[modelName];
      }
    });
  }

  return sorted;
};
