import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getModelsForPull } from '../../src/sync';
import { closeDatabase, createTestDatabase } from '../utilities';

// facilities.sensitive_network_id reaches sync_lookup only through
// ADD_SENSITIVE_FACILITY_ID_IF_APPLICABLE, so its presence in a model's select is what makes that
// model's rows facility scoped
const SENSITIVE_SCOPE_MARKER = 'facilities.sensitive_network_id';

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

      // a record hanging off an encounter belongs to that encounter's facility, so it has to be
      // withheld from other facilities whenever that facility is sensitive - otherwise it syncs
      // somewhere its parent doesn't, and the child arrives with no parent to attach to
      const isEncounterLinked =
        model.tableName === 'encounters' || /JOIN\s+encounters\b/.test(joins ?? '');

      if (isEncounterLinked && !select?.includes(SENSITIVE_SCOPE_MARKER)) {
        unscopedTables.push(model.tableName);
      }
    }

    expect(
      unscopedTables,
      'These models hang off an encounter but leave sync_lookup.facility_id null, so their rows ' +
        'sync to every facility while the encounter itself is withheld from all but a sensitive ' +
        'one - the child then lands on a facility with no parent to attach to. Build their lookup ' +
        'query with buildEncounterLinkedLookupFilter, or with buildEncounterLinkedLookupSelect ' +
        'plus joins that reach facilities (see AiDocument or Note for a polymorphic parent)',
    ).toEqual([]);
  });
});
