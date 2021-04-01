import { DependencyGraph } from 'shared/utils';
import { initDb } from '../initDb';

describe('DependencyGraph', () => {
  let models;
  beforeAll(async () => {
    models = (await initDb()).models;
  });

  it('forms a dependency graph of models and runs it in order', async () => {
    // arrange
    const deps = DependencyGraph.fromModels(models);

    // act
    const resultsOrder = [];
    await deps.run(name => resultsOrder.push(name));

    // assert
    resultsOrder.forEach((result, resultIndex) => {
      deps.nodes[result].forEach(dep => {
        const depIndex = resultsOrder.indexOf(dep);
        expect(depIndex).toBeGreaterThan(-1);
        expect(depIndex).toBeLessThan(resultIndex);
      });
    });
  });

  it('includes dependencies from includedSyncRelations', () => {
    const graph = DependencyGraph.fromModels(models);
    expect(graph.nodes.Encounter).toContain('AdministeredVaccine');
  });
});
