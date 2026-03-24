import { tablesWithoutTrigger, tablesWithTrigger } from '../utils';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { log } from '@tamanu/shared/services/logging';
import { FHIR_INTERACTIONS } from '@tamanu/constants';

/**
 * Add or remove fhir_refresh triggers on upstream tables of materialisable FHIR resources.
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ fhirWorkerEnabled: boolean }} options - fhirWorkerEnabled: when true, add triggers; when false, remove them
 */
export const setFhirRefreshTriggers = async (sequelize, { fhirWorkerEnabled }) => {
  const materialisableResources = resourcesThatCanDo(
    Object.values(sequelize.models),
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );
  const allUpstreams = Array.from(
    new Set(
      materialisableResources.flatMap(
        resource => resource.upstreams?.map(upstream => upstream.tableName) || [],
      ),
    ),
  );

  await sequelize.transaction(async () => {
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'fhir_refresh_', '')) {
      if (!fhirWorkerEnabled || schema !== 'public' || !allUpstreams.includes(table)) {
        continue;
      }

      log.info(`Adding fhir_refresh trigger to ${schema}.${table}`);
      // Use a PL/pgSQL block to handle the race where multiple concurrent
      // ApplicationContext.init() calls (api, fhir-worker, tasks) all see the
      // trigger as missing and try to create it simultaneously.
      // EXECUTE format(%I) safely quotes identifiers to prevent injection.
      await sequelize.query(`
          DO $block$ BEGIN
            EXECUTE format(
              'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger()',
              ${sequelize.escape(`fhir_refresh_${table}`)},
              ${sequelize.escape(schema)},
              ${sequelize.escape(table)}
            );
          EXCEPTION WHEN duplicate_object THEN
            NULL;
          END $block$;
      `);
    }

    for (const { schema, table } of await tablesWithTrigger(sequelize, 'fhir_refresh_', '')) {
      if (!fhirWorkerEnabled || (schema === 'public' && !allUpstreams.includes(table))) {
        log.info(`Removing fhir_refresh trigger from ${schema}.${table}`);
        await sequelize.query(`
          DO $block$ BEGIN
            EXECUTE format(
              'DROP TRIGGER IF EXISTS %I ON %I.%I',
              ${sequelize.escape(`fhir_refresh_${table}`)},
              ${sequelize.escape(schema)},
              ${sequelize.escape(table)}
            );
          END $block$;
        `);
      }
    }
  });
};
