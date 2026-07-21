import { tablesWithTrigger } from '../utils';
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
    if (fhirWorkerEnabled) {
      for (const table of allUpstreams) {
        log.info(`Adding fhir_refresh trigger to public.${table}`);
        await sequelize.query(`
          DROP TRIGGER IF EXISTS "fhir_refresh_${table}" ON "public"."${table}";
          CREATE TRIGGER "fhir_refresh_${table}"
            AFTER INSERT OR UPDATE OR DELETE ON "public"."${table}"
            FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();
        `);
      }
    }

    for (const { schema, table } of await tablesWithTrigger(sequelize, 'fhir_refresh_', '')) {
      if (!fhirWorkerEnabled || (schema === 'public' && !allUpstreams.includes(table))) {
        log.info(`Removing fhir_refresh trigger from ${schema}.${table}`);
        await sequelize.query(`
          DROP TRIGGER IF EXISTS "fhir_refresh_${table}" ON "${schema}"."${table}";
        `);
      }
    }
  });
};
