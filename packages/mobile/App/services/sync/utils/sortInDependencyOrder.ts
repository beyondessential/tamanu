import { getManager } from 'typeorm';
import { groupBy } from 'lodash';

import { MODELS_MAP } from '~/models/modelsMap';
import { BaseModel } from '~/models/BaseModel';

type DependencyMap = {
  [tableName: string]: string[];
};

/**
 * Get dependency map of tables
 * ie:
 * {
 *  'survey_screen_component': ['survey_screen', 'program_data_element'],
 *  ....
 * }
 * @returns 
 */
const getDependencyMap = async (): Promise<DependencyMap> => {
  const entityManager = getManager();
  const dependencies = await entityManager.query(`
    SELECT DISTINCT
      m.name as "modelName", 
      p."table" as "dependency"
    FROM
      sqlite_master m
      JOIN pragma_foreign_key_list(m.name) p ON m.name != p."table"
    ORDER BY m.name;
  `);

  const dependenciesGroupedByModel = groupBy(dependencies, 'modelName');
  const dependencyMap = {};

  Object.entries(dependenciesGroupedByModel).forEach(([modelName, dependencyObjects]) => {
    if (!dependencyMap[modelName]) {
      dependencyMap[modelName] = [];
    }
    const dependencies = dependencyObjects.map(d => d.dependency);
    dependencyMap[modelName].push(...dependencies);
  });

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
const getTableNameToModelName = (models: typeof MODELS_MAP) => {
  const tableNameToModelName = {};

  Object.values(models).forEach(model => {
    const tableName = model.getRepository().metadata.tableName;
    const modelName = model.name;
    tableNameToModelName[tableName] = modelName;
  });

  return tableNameToModelName;
};

/**
 * Sort the models in order of persist based on foreign keys so that they are imported in the right order
 * @param models 
 * @returns 
 */
export const sortInDependencyOrder = async (
  models: typeof MODELS_MAP,
): Promise<typeof BaseModel[]> => {
  const dependencyMap = await getDependencyMap();
  const sorted = [];
  const stillToSort = { ...models };
  const tableNameToModelName = getTableNameToModelName(models);

  while (Object.keys(stillToSort).length > 0) {
    Object.values(stillToSort).forEach(model => {
      const tableName = model.getRepository().metadata.tableName;
      const modelName = model.name;
      const dependsOn = dependencyMap[tableName] || [];
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort[tableNameToModelName[d]]);

      if (dependenciesStillToSort.length === 0) {
        sorted.push(model);
        delete stillToSort[modelName];
      }
    });
  }

  return sorted;
};
