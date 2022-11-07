import * as fc from 'fast-check';
import { uniq } from 'lodash';

import { SYNC_DIRECTIONS } from '../../src/constants';
import { Model } from '../../src/models/Model';
import { sortInDependencyOrder } from '../../src/models/sortInDependencyOrder';

function modelTrees() {
  const { tree } = fc.letrec(tie => ({
    tree: fc.oneof({ depthSize: 'large' }, tie('leaf'), tie('node')),
    node: fc.tuple(tie('tree'), tie('tree')),
    leaf: fc.constant('leaf'),
  }));

  return tree.map(tree => pairsToModels(treeToPairs([tree])));
}

class bidi extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }
}

function treeToPairs(tree, dependent = 0) {
  let i = 0;
  return tree.flatMap(element => {
    if (element === 'leaf') {
      i += 1;
      return [[dependent, i].sort((a, b) => b - a)];
    }

    return treeToPairs(element, (dependent += 1));
  });
}

function allNs(pairs) {
  return uniq(pairs.reduce((acc, [a, b]) => [...acc, a, b], []).sort((a, b) => b - a));
}

function pairsToModels(pairs) {
  const models = Object.fromEntries(
    allNs(pairs)
      .map(i => {
        return [
          `Model${i}`,
          class extends bidi {
            static name = `Model${i}`;
            static associations = {};
          },
        ];
      })
      .sort(() => Math.random() - 0.5),
  );

  for (const [child, parent] of pairs) {
    const childModel = models[`Model${child}`];
    const parentModel = models[`Model${parent}`];
    childModel.associations[`belongsTo${parentModel.name}`] = {
      associationType: 'BelongsTo',
      isSelfAssociation: childModel.name === parentModel.name,
      target: parentModel,
    };
    parentModel.associations[`hasMany${childModel.name}`] = {
      associationType: 'HasMany',
      isSelfAssociation: childModel.name === parentModel.name,
      target: childModel,
    };
  }

  return models;
}

describe('sortInDependencyOrder', () => {
  it('does not crash (fuzz test)', () => {
    fc.assert(
      fc.property(modelTrees(), models => {
        const sorted = sortInDependencyOrder(models);
        expect(sorted.length).toEqual(Object.keys(models).length);
      }),
    );
  });

  it('sorts a chain of models', () => {
    const models = pairsToModels([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model4', 'Model3', 'Model2', 'Model1']);
  });

  it('sorts a reversed chain of models', () => {
    const models = pairsToModels([
      [2, 1],
      [3, 2],
      [4, 3],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model1', 'Model2', 'Model3', 'Model4']);
  });

  it('sorts a 2-chains tree', () => {
    const models = pairsToModels([
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual([
      'Model4',
      'Model5',
      'Model2',
      'Model3',
      'Model1',
    ]);
  });

  it('sorts two overlapping trees', () => {
    const models = pairsToModels([
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model3', 'Model4', 'Model1', 'Model2']);
  });

  it('sorts a medium tree', () => {
    const models = pairsToModels([
      [10, 20],
      [10, 21],

      [20, 30],
      [20, 31],

      [21, 32],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual([
      'Model30',
      'Model31',
      'Model32',

      'Model20',
      'Model21',

      'Model10',
    ]);
  });

  it('sorts a deep tree', () => {
    const models = pairsToModels([
      [10, 20],
      [10, 21],

      [20, 30],
      [20, 31],
      [21, 32],
      [21, 33],
      [21, 34],

      [30, 40],
      [30, 41],
      [30, 42],
      [32, 43],
      [34, 44],
      [34, 45],

      [43, 50],
      [43, 51],
      [44, 52],
      [44, 53],
      [44, 54],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual([
      'Model31',
      'Model33',
      'Model40',
      'Model41',
      'Model42',
      'Model45',
      'Model50',
      'Model51',
      'Model52',
      'Model53',
      'Model54',

      'Model30',
      'Model43',
      'Model44',

      'Model20',
      'Model32',
      'Model34',

      'Model21',

      'Model10',
    ]);
  });
});
