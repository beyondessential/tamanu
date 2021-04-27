import { shouldSync } from '../models/sync';

/*
 *  Usage:
 *
 *    const graph = new DependencyGraph({
 *      a: ['b', 'c'],
 *      b: [],
 *      c: ['b'],
 *    });
 *    await graph.run(task => console.log(`=> ${task}`));
 *
 *
 *  Output:
 *
 *    => b
 *    => c
 *    => a
 */
export class DependencyGraph {
  nodes = null;

  constructor(nodes) {
    this.nodes = nodes;
  }

  clone() {
    return new DependencyGraph(
      Object.entries(this.nodes).reduce((memo, [k, v]) => ({ ...memo, [k]: [...v] }), {}),
    );
  }

  removeDep(name) {
    return new DependencyGraph(
      Object.entries(this.nodes).reduce((memo, [jobName, jobDeps]) => {
        if (jobName === name) {
          return memo;
        }
        return {
          ...memo,
          [jobName]: jobDeps.filter(d => d !== name),
        };
      }, {}),
    );
  }

  nodeCount() {
    return Object.keys(this.nodes).length;
  }

  async run(fn) {
    let currentGraph = this;
    const running = {};
    const completed = {};

    const runJob = async name => {
      await fn(name);
      completed[name] = true;
      delete running[name];
      currentGraph = currentGraph.removeDep(name);
    };

    let remainingJobsCount;
    // while there are remaining jobs, loop through the graph finding unstarted jobs
    // with no dependencies, and removing completed dependencies, until there's
    // nothing left
    while (currentGraph.nodeCount() > 0) {
      remainingJobsCount = currentGraph.nodeCount();
      for (const [jobName, jobDeps] of Object.entries(currentGraph.nodes)) {
        if (running[jobName] === undefined && completed[jobName] === undefined && jobDeps.length === 0) {
          running[jobName] = runJob(jobName);
        }
      }
      const runningList = Object.values(running);
      if (runningList.length > 0) {
        await Promise.race(runningList);
      }
      if (remainingJobsCount === currentGraph.nodeCount()) {
        console.error(currentGraph.nodes);
        throw new Error('DependencyGraph: cycle detected');
      }
    }
  }

  static fromModels(models) {
    // calculate direct dependencies
    const fullDeps = {};
    Object.entries(models).forEach(([modelName, model]) => {
      if (!shouldSync(model)) {
        return;
      }
      const depList = getDepsFromModel(model);
      fullDeps[modelName] = depList;
    });

    // calculate includedSyncRelation dependencies
    const syncableDeps = {};
    Object.entries(models).forEach(([modelName, model]) => {
      if (!shouldSync(model)) {
        return;
      }
      const relationDepList = model.includedSyncRelations.map(relationPath => {
        const nestedModels = getModelsFromRelationPath(model, relationPath);
        return nestedModels.map(nm => getDepsFromModel(nm));
      }).flat(2).filter(depName => depName !== modelName);
      syncableDeps[modelName] = [...new Set([...fullDeps[modelName], ...relationDepList])]; // get unique values
    });

    return new DependencyGraph(syncableDeps);
  }
}

const getDepsFromModel = model => 
  Object.values(model.associations)
    .map(association => {
      if (!shouldSync(association.target)) {
        return null;
      }
      if (association.associationType === 'BelongsTo') {
        return association.target.name;
      }
      if (association.associationType === 'BelongsToMany') {
        // TODO: implement BelongsToMany
        throw new Error('DependencyGraph: BelongsToMany not implemented yet');
      }
      return null;
    })
    .filter(name => name);

const getModelsFromRelationPath = (rootModel, path) => {
  const models = [];
  let currentModel = rootModel;
  for (const name of path.split('.')) {
    const association = currentModel.associations[name];
    currentModel = association?.target;
    if (!currentModel) {
      throw new Error(
        `getModelsFromRelationPath: could not find ${name} on root model ${rootModel.name}, relation path ${path} (you might have an incorrect path in an includedSyncRelations array)`,
      );
    }
    models.push(currentModel);
  }
  return models;
};
