import * as fc from 'fast-check';
import { SYNC_DIRECTIONS, SYNC_DIRECTIONS_VALUES } from '@tamanu/constants';

import { Model } from '../../src/models/Model';
import { getModelsForDirection } from '../../src/sync/getModelsForDirection';

const arbitrarySyncDirection = fc.oneof(...SYNC_DIRECTIONS_VALUES.map(dir => fc.constant(dir)));
const directionalSyncDirection = fc.oneof(
  fc.constant(SYNC_DIRECTIONS.PUSH_TO_CENTRAL),
  fc.constant(SYNC_DIRECTIONS.PULL_FROM_CENTRAL),
);

function modelFromDirection(syncDirection) {
  return class extends Model {
    static init({ primaryKey, ...options }) {
      super.init(
        {
          id: primaryKey,
        },
        {
          ...options,
          syncDirection,
        },
      );
    }
  };
}

function modelsFromDirections(directions) {
  return Object.fromEntries(
    directions.map((direction, i) => [`Model${i}`, modelFromDirection(direction)]),
  );
}

describe('getModelsForDirection', () => {
  it('includes models with bidirectional sync direction', () => {
    fc.assert(
      fc.property(
        directionalSyncDirection,
        fc.array(arbitrarySyncDirection),
        (given, modelDirections) => {
          const models = modelsFromDirections(modelDirections);

          const filteredDirections = Object.entries(getModelsForDirection(models, given)).map(
            ([, model]) => model.syncDirection,
          );

          if (
            filteredDirections.length &&
            modelDirections.includes(SYNC_DIRECTIONS.BIDIRECTIONAL)
          ) {
            expect(filteredDirections).toContain(SYNC_DIRECTIONS.BIDIRECTIONAL);
          }
        },
      ),
    );
  });

  it('includes models with the given direction', () => {
    fc.assert(
      fc.property(
        directionalSyncDirection,
        fc.array(arbitrarySyncDirection),
        (given, modelDirections) => {
          const models = modelsFromDirections(modelDirections);

          const filteredDirections = Object.entries(getModelsForDirection(models, given)).map(
            ([, model]) => model.syncDirection,
          );

          if (filteredDirections.length && modelDirections.includes(given)) {
            expect(filteredDirections).toContain(given);
          }
        },
      ),
    );
  });

  it('excludes models with a differing direction from given', () => {
    fc.assert(
      fc.property(fc.array(arbitrarySyncDirection), modelDirections => {
        const models = modelsFromDirections(modelDirections);

        expect(
          Object.entries(getModelsForDirection(models, SYNC_DIRECTIONS.PUSH_TO_CENTRAL)).map(
            ([, model]) => model.syncDirection,
          ),
        ).not.toContain(SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

        expect(
          Object.entries(getModelsForDirection(models, SYNC_DIRECTIONS.PULL_FROM_CENTRAL)).map(
            ([, model]) => model.syncDirection,
          ),
        ).not.toContain(SYNC_DIRECTIONS.PUSH_TO_CENTRAL);
      }),
    );
  });

  it('excludes models with DO_NOT_SYNC', () => {
    fc.assert(
      fc.property(
        directionalSyncDirection,
        fc.array(arbitrarySyncDirection),
        (given, modelDirections) => {
          const models = modelsFromDirections(modelDirections);

          expect(
            Object.entries(getModelsForDirection(models, given)).map(
              ([, model]) => model.syncDirection,
            ),
          ).not.toContain(SYNC_DIRECTIONS.DO_NOT_SYNC);
        },
      ),
    );
  });
});
