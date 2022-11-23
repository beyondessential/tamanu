import * as fc from 'fast-check';
import { uniq } from 'lodash';

import { SYNC_DIRECTIONS } from '../../src/constants';
import { Model } from '../../src/models/Model';
import { sortInDependencyOrder } from '../../src/models/sortInDependencyOrder';

function modelTrees() {
  // `tie` is literally the word "tie", as in tying a knot. We're creating a recursive
  // structure (letrec = "let recursive") by creating segments of structure and "tying"
  // them together at certain points. You can find this exact example in the fast-check
  // docs! https://dubzzz.github.io/fast-check/functions/letrec.html
  const { tree } = fc.letrec(tie => ({
    tree: fc.oneof({ depthSize: 'large' }, tie('leaf'), tie('node')),
    node: fc.tuple(tie('tree'), tie('tree')),
    leaf: fc.constant('leaf'),
  }));

  return tree.map(tree => pairsToModels(treeToPairs([tree])));
}

class BaseSyncingModel extends Model {
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

// This transforms a tree into pairs of numbers, each representing a relationship
// or "edge" between nodes: (N, M) where N is "higher" in the tree. In the context,
// higher nodes are models which are dependent on lower ones.
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

function pairsToUniqueItems(pairs) {
  return uniq(pairs.reduce((acc, [a, b]) => [...acc, a, b], []).sort((a, b) => b - a));
}

// We create models that have the dependence relationships described by the pairs.
// Splitting this out means we can both create model trees from randomly-generated
// trees (with fast-check) and from hard-coded lists of pairs as a sort of simple
// syntax for representing arbitrary trees.
function pairsToModels(pairs) {
  const models = Object.fromEntries(
    pairsToUniqueItems(pairs)
      .map(i => {
        return [
          `Model${i}`,
          class extends BaseSyncingModel {
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
  
  // in all following examples, `->` means "dependent on"

  it('sorts a chain of models', () => {
    /*
    1 -> 2 -> 3 -> 4
    */
    const models = pairsToModels([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model4', 'Model3', 'Model2', 'Model1']);
  });

  it('sorts a reversed chain of models', () => {
    /*
    4 -> 3 -> 2 -> 1
    (or equivalently)
    1 <- 2 <- 3 <- 4
    */
    const models = pairsToModels([
      [2, 1],
      [3, 2],
      [4, 3],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model1', 'Model2', 'Model3', 'Model4']);
  });

  it('sorts a 2-chains tree', () => {
    /*
        2 -> 4
    1 ->|
        3 -> 5
    */
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
    /*
    1 -> 3
     \ /
     / \
    2 -> 4
    
    this is a bit weird, but conceptually it's both of these trees merged:
    
        3          3
    1 ->|      2 ->|
        4          4
    
    so there's two roots, and two common dependencies
    */
    const models = pairsToModels([
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ]);

    const sorted = sortInDependencyOrder(models);

    expect(sorted.map(model => model.name)).toEqual(['Model3', 'Model4', 'Model1', 'Model2']);
  });
  
  // in these next ones, the node numbers are NM, where N is the depth of the node
  // and M is the number of the node *within that depth*. this makes it a bit easier
  // to figure out the shape of the tree and remind yourself where the models are at
  // from the output.

  it('sorts a medium tree', () => {
    /*
              30
         20 ->|
    10 ->|    31
         |
         21 ->32
    */
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
    /*
                     +-40
                I    |
              +-30 ->+-41
              |      |
         II   |      +-42
         20 ->|
         |    +-31
    10 ->|
    IV   |      II     I    +-50
         |    +-32  -> 43 ->|
         |    |             +-51
         21 ->+-33
        III   |             +-52
              |        I    |
              |      +-44 ->+-53
              | II   |      |
              +-34 ->|      +-54
                     +-45
    */

    const sorted = sortInDependencyOrder(models);

    // because of the multiple maximum depths of the tree, there is mixing of levels in each
    // group below, which roughly represent the levels of dependence. if you start from each
    // leaf in the graph, and count I, II, III, IV for each level of dependency, you can see
    // where the groups get made. these "reverse levels" are marked on the ascii art above.
    expect(sorted.map(model => model.name)).toEqual([
      // level 0 - no dependencies
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

      // level I
      'Model30',
      'Model43',
      'Model44',

      // level II
      'Model20',
      'Model32',
      'Model34',

      // level III
      'Model21',

      // level IV
      'Model10',
    ]);
  });
});
