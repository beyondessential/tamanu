import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getModelsForPull } from '../../src/sync';
import { closeDatabase, createTestDatabase } from '../utilities';

describe('sync lookup facility scope', () => {
  let models;

  beforeAll(async () => {
    ({ models } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('scopes every encounter linked model to the facility of its encounter', async () => {
    const unscopedTables: string[] = [];

    for (const model of Object.values<any>(getModelsForPull(models))) {
      const { select, joins } = (await model.buildSyncLookupQueryDetails({})) ?? {};

      // a record hanging off an encounter belongs to that encounter's network, so it has to be
      // withheld from facilities outside that network - otherwise it syncs somewhere its parent
      // doesn't, and the child arrives with no parent to attach to
      const isEncounterLinked =
        model.tableName === 'encounters' || /JOIN\s+encounters\b/.test(joins ?? '');

      // a model's rows are network scoped exactly when its select carries this column
      if (isEncounterLinked && !select?.includes('facilities.sensitive_network_id')) {
        unscopedTables.push(model.tableName);
      }
    }

    expect(
      unscopedTables,
      'These models hang off an encounter but leave sync_lookup.sensitive_network_id null, so ' +
        'their rows sync to every facility while the encounter itself is withheld from all but ' +
        'its network - the child then lands on a facility with no parent to attach to. Build their lookup ' +
        'query with buildEncounterLinkedLookupFilter, or with buildEncounterLinkedLookupSelect ' +
        'plus joins that reach facilities (see AiDocument or Note for a polymorphic parent)',
    ).toEqual([]);
  });
});
