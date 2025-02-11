import * as fc from 'fast-check';
import { SYNC_DIRECTIONS, SYNC_DIRECTIONS_VALUES } from '@tamanu/constants';
import { getModelsForPush, getModelsForPull } from '../../src/sync/getModelsForDirection';
import { describe, expect, it } from 'vitest';

import { Model } from '../../src/models/Model';
import type { InitOptions } from '../../src/types/model';

const arbitrarySyncDirection = fc.oneof(...SYNC_DIRECTIONS_VALUES.map((dir) => fc.constant(dir)));

function modelFromDirection(syncDirection) {
  return class extends Model {
    static initModel({ primaryKey, ...options }: InitOptions) {
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

describe('getModelsForPull', () => {
  it('includes models with pull sync directions', () => {
    fc.assert(
      fc.property(fc.array(arbitrarySyncDirection), (modelDirections) => {
        const models = modelsFromDirections(modelDirections);

        const filteredDirections = Object.entries(getModelsForPull(models)).map(
          ([, model]) => model.syncDirection,
        );

        if (
          filteredDirections.length &&
          modelDirections.includes(SYNC_DIRECTIONS.PULL_FROM_CENTRAL)
        ) {
          expect(filteredDirections).toContain(SYNC_DIRECTIONS.PULL_FROM_CENTRAL);
        }

        if (filteredDirections.length && modelDirections.includes(SYNC_DIRECTIONS.BIDIRECTIONAL)) {
          expect(filteredDirections).toContain(SYNC_DIRECTIONS.BIDIRECTIONAL);
        }
      }),
    );
  });

  it('excludes models with a non-pull direction', () => {
    fc.assert(
      fc.property(fc.array(arbitrarySyncDirection), (modelDirections) => {
        const models = modelsFromDirections(modelDirections);

        const syncDirections = Object.entries(getModelsForPull(models)).map(
          ([, model]) => model.syncDirection,
        );

        expect(syncDirections).not.toContain(SYNC_DIRECTIONS.PUSH_TO_CENTRAL);

        expect(syncDirections).not.toContain(SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE);

        expect(syncDirections).not.toContain(SYNC_DIRECTIONS.DO_NOT_SYNC);
      }),
    );
  });
});

describe('getModelsForPush', () => {
  it('includes models with push sync directions', () => {
    fc.assert(
      fc.property(fc.array(arbitrarySyncDirection), (modelDirections) => {
        const models = modelsFromDirections(modelDirections);

        const filteredDirections = Object.entries(getModelsForPush(models)).map(
          ([, model]) => model.syncDirection,
        );

        if (
          filteredDirections.length &&
          modelDirections.includes(SYNC_DIRECTIONS.PUSH_TO_CENTRAL)
        ) {
          expect(filteredDirections).toContain(SYNC_DIRECTIONS.PUSH_TO_CENTRAL);
        }

        if (
          filteredDirections.length &&
          modelDirections.includes(SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE)
        ) {
          expect(filteredDirections).toContain(SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE);
        }

        if (filteredDirections.length && modelDirections.includes(SYNC_DIRECTIONS.BIDIRECTIONAL)) {
          expect(filteredDirections).toContain(SYNC_DIRECTIONS.BIDIRECTIONAL);
        }
      }),
    );
  });

  it('excludes models with a non-push direction', () => {
    fc.assert(
      fc.property(fc.array(arbitrarySyncDirection), (modelDirections) => {
        const models = modelsFromDirections(modelDirections);

        const syncDirections = Object.entries(getModelsForPull(models)).map(
          ([, model]) => model.syncDirection,
        );

        expect(syncDirections).not.toContain(SYNC_DIRECTIONS.PULL_FROM_CENTRAL);

        expect(syncDirections).not.toContain(SYNC_DIRECTIONS.DO_NOT_SYNC);
      }),
    );
  });
});
