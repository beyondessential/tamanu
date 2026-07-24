import { tablesWithoutTrigger, tablesWithTrigger } from '../utils';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { log } from '@tamanu/shared/services/logging';
import { FHIR_INTERACTIONS } from '@tamanu/constants';
import {
  ReferenceData,
  Department,
  Location,
  LocationGroup,
  LabTestType,
  LabTestPanel,
  ScheduledVaccine,
  ImagingAreaExternalCode,
  ImagingTypeExternalCode,
} from '../models';

// Reference data (and reference-data-like config/master data such as lab test types or location
// groups) is still read when a FHIR resource is (re)materialised for some other reason, so these
// models stay listed in each resource's `upstreams`. But changes to this data must not queue a
// rematerialisation on their own (eventual drift is accepted), so their tables are excluded here
// rather than getting a fhir_refresh trigger.
//
// Excludes only models that are always *incidental* context (never a resource's own primary
// `UpstreamModels` entity) — e.g. `Facility` is reference data too, but it's `FhirOrganization`'s
// own upstream, so it stays out of this list and keeps triggering FhirOrganization's refresh.
const REFERENCE_DATA_MODELS = [
  ReferenceData,
  Department,
  Location,
  LocationGroup,
  LabTestType,
  LabTestPanel,
  ScheduledVaccine,
  ImagingAreaExternalCode,
  ImagingTypeExternalCode,
];

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
  const referenceDataTables = new Set(REFERENCE_DATA_MODELS.map(model => model.tableName));
  const allUpstreams = Array.from(
    new Set(
      materialisableResources.flatMap(
        resource => resource.upstreams?.map(upstream => upstream.tableName) || [],
      ),
    ),
  ).filter(table => !referenceDataTables.has(table));

  await sequelize.transaction(async () => {
    for (const { schema, table } of await tablesWithoutTrigger(sequelize, 'fhir_refresh_', '')) {
      if (!fhirWorkerEnabled || schema !== 'public' || !allUpstreams.includes(table)) {
        continue;
      }

      log.info(`Adding fhir_refresh trigger to ${schema}.${table}`);
      // PL/pgSQL block handles the race where multiple concurrent
      // ApplicationContext.init() calls all see the trigger as missing
      // and try to create it simultaneously.
      await sequelize.query(`
          DO $block$ BEGIN
            CREATE TRIGGER "fhir_refresh_${table}"
              AFTER INSERT OR UPDATE OR DELETE ON "${schema}"."${table}"
              FOR EACH ROW EXECUTE FUNCTION fhir.refresh_trigger();
          EXCEPTION WHEN duplicate_object THEN
            NULL;
          END $block$;
      `);
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
