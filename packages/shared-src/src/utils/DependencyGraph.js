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
    do {
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
        throw new Error('DependencyGraph: cycle detected');
      }
    } while (currentGraph.nodeCount() > 0);
  }

  static fromModels(models) {
    const deps = {};
    Object.entries(models).forEach(([modelName, model]) => {
      const depList = Object.values(model.associations)
        .map(association => {
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
      deps[modelName] = [...new Set(depList)]; // get unique values
    });
    return new DependencyGraph(deps);
  }
}

