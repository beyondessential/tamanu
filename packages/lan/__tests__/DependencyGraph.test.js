import { DependencyGraph } from 'shared/utils';
import { createTestContext } from './utilities';

describe('depgraph', () => {
  let models;
  beforeAll(async () => {
    models = (await createTestContext()).models;
  });

  it('forms a dependency graph of models and runs it in order', async () => {
    // arrange
    const deps = DependencyGraph.fromModels(models);

    // act
    const resultsOrder = Object.keys(await deps.run(name => name));

    // assert
    resultsOrder.forEach((result, resultIndex) => {
      deps.nodes[result].forEach(dep => {
        const depIndex = resultsOrder.indexOf(dep);
        expect(depIndex).toBeGreaterThan(-1);
        expect(depIndex).toBeLessThan(resultIndex);
      });
    });
  });
});
