import { Database } from '~/infra/db';
import { MODELS_ARRAY } from '~/models/modelsMap';

// An eager relation is joined on every find-family call (find, findOne, count, exists…) and on the
// sync push snapshot, whether or not the caller reads it. Load relations where they are needed
// instead: `relations: [...]` on the find, or a join in a query builder.

beforeAll(async () => {
  await Database.connect();
});

MODELS_ARRAY.forEach(model => {
  it(`${model.name} has no eager relations`, () => {
    const eagerRelations = model.getRepository().metadata.eagerRelations;
    expect(eagerRelations.map(relation => relation.propertyPath)).toEqual([]);
  });
});
