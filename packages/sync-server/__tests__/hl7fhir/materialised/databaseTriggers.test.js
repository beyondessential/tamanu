/*
If your PR is red because of this test you probably need to add
a migration that registers a trigger for database tables.
*/

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
import { createTestContext } from '../../utilities';

expect.extend({
  async toHaveARegisteredTrigger(tableName, triggerType, triggers) {
    if (typeof tableName !== 'string') {
      return {
        pass: false,
        message: () => 'must receive a string',
      };
    }
    if (typeof triggerType !== 'string') {
      return {
        pass: false,
        message: () => 'triggerType should be a string',
      };
    }
    if (Array.isArray(triggers) === false) {
      return {
        pass: false,
        message: () => 'triggers should be an array',
      };
    }
    if (triggers.includes(tableName) === false) {
      return {
        pass: false,
        message: () => `Table ${tableName} is missing a ${triggerType} trigger`,
      };
    }

    return {
      pass: true,
    };
  },
});

// If for some reason we don't want to add triggers to a specific table
// this would be the place to add them.
const versioningTablesToIgnore = [];
const refreshTablesToIgnore = [];

describe('databaseTriggers', () => {
  let ctx;
  let tablesWithVersioningTrigger;
  let tablesWithRefreshTrigger;
  let materialisableResources;

  beforeAll(async () => {
    ctx = await createTestContext();
    materialisableResources = resourcesThatCanDo(
      ctx.store.models,
      FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    );
    const [queryResultOne] = await ctx.store.sequelize.query(`
      SELECT DISTINCT event_object_table
      FROM information_schema.triggers
      WHERE action_statement = 'EXECUTE FUNCTION fhir.trigger_versioning()'
    `);
    tablesWithVersioningTrigger = queryResultOne.map(x => x.event_object_table);

    const [queryResultTwo] = await ctx.store.sequelize.query(`
      SELECT DISTINCT event_object_table
      FROM information_schema.triggers
      WHERE action_statement = 'EXECUTE FUNCTION fhir.refresh_trigger()'
    `);
    tablesWithRefreshTrigger = queryResultTwo.map(x => x.event_object_table);
  });
  afterAll(() => ctx.close());

  it('should have a versioning trigger', () => {
    for (const { tableName } of materialisableResources) {
      if (versioningTablesToIgnore.includes(tableName)) continue;
      expect(tableName).toHaveARegisteredTrigger('versioning', tablesWithVersioningTrigger);
    }
  });

  it('should have a refresh trigger', () => {
    for (const Resource of materialisableResources) {
      for (const { tableName } of Resource.upstreams) {
        if (refreshTablesToIgnore.includes(tableName)) continue;
        expect(tableName).toHaveARegisteredTrigger('refresh', tablesWithRefreshTrigger);
      }
    }
  });
});
