import { getManager } from 'typeorm';
import { groupBy } from 'lodash';

const getDependencyMap = async () => {
  const entityManager = getManager();
  const dependencies = await entityManager.query(`
    SELECT DISTINCT
      m.name as "model", 
      p."table" as "dependency"
    FROM
      sqlite_master m
      JOIN pragma_foreign_key_list(m.name) p ON m.name != p."table"
    ORDER BY m.name;
  `);

  const dependenciesGroupedByModel = groupBy(dependencies, 'model');
  const dependencyMap = {};

  Object.entries(dependenciesGroupedByModel).forEach(([model, dependencyObjects]) => {
    if (!dependencyMap[model]) {
      dependencyMap[model] = [];
    }
    const dependencies = dependencyObjects.map(d => d.dependency);
    dependencyMap[model].push(...dependencies);
  });

  return dependencyMap;
};

const getTableNameToModelName = models => {
  const tableNameToModelName = {};

  Object.values(models).forEach(model => {
    const tableName = model.getRepository().metadata.tableName;
    const modelName = model.name;
    tableNameToModelName[tableName] = modelName;
  });

  return tableNameToModelName;
};

export const sortInDependencyOrder = async models => {
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
