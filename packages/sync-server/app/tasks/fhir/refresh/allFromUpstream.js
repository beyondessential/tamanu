import { Sequelize } from 'sequelize';
import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
import { prepareQuery } from '../../../utils/prepareQuery';

export async function allFromUpstream({ payload }, { log, sequelize, models }) {
  const { table, op, id, deletedRow = null } = payload;
  const [schema, tableName] = table.toLowerCase().split('.', 2);

  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );
  const resources = materialisableResources.filter(resource =>
    resource.upstreams.some(upstream => {
      const upstreamTable = upstream.getTableName();
      if (typeof upstreamTable === 'string') {
        return schema === 'public' && upstreamTable.toLowerCase() === tableName;
      }

      return (
        upstreamTable.schema?.toLowerCase() === schema &&
        upstreamTable.tableName?.toLowerCase() === tableName
      );
    }),
  );
  if (resources.length === 0) {
    log.warn('No materialisable FHIR resource found for table', {
      table,
    });
    return;
  }

  for (const Resource of resources) {
    log.debug('finding upstream for row', {
      resource: Resource.fhirName,
      table,
      id,
      op,
    });

    for (const UpstreamModel of Resource.UpstreamModels) {
      const queryToFilterUpstream = await Resource.queryToFilterUpstream(UpstreamModel.tableName);
      const queryToFindUpstreamIdsFromTable = await Resource.queryToFindUpstreamIdsFromTable(
        UpstreamModel.tableName,
        tableName,
        id,
        deletedRow,
      );

      if (!queryToFindUpstreamIdsFromTable) {
        log.debug('no upstream found for row', {
          resource: Resource.fhirName,
          table,
          id,
          op,
        });
        continue;
      }

      const sql = await innerJoinQueriesToSql(
        UpstreamModel,
        queryToFilterUpstream,
        queryToFindUpstreamIdsFromTable,
      );

      const insertSql = `
        WITH upstreams AS (${sql.replaceAll(';', '')})
        INSERT INTO fhir.jobs (topic, discriminant, payload)
        SELECT
          $topic::text,
          concat($resource::text, ':', upstreams.id),
          json_build_object(
            'resource', $resource::text,
            'upstreamId', upstreams.id,
            'table', $table::text,
            'op', $op::text
          )
        FROM upstreams
        ON CONFLICT (discriminant) DO NOTHING
      `;

      const results = await sequelize.query(insertSql, {
        type: Sequelize.QueryTypes.INSERT,
        bind: {
          topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
          resource: Resource.fhirName,
          table,
          op,
        },
      });
      if (!results) {
        throw new Error(`Failed to insert jobs: ${JSON.stringify(results)}`);
      }

      log.debug('FhirWorker: submitted refresh jobs', {
        resource: Resource.fhirName,
        count: results[1],
      });
    }
  }
}

async function innerJoinQueriesToSql(
  UpstreamModel,
  queryToFilterUpstream,
  queryToFindUpstreamIdsFromTable,
) {
  const sqlToFindUpstreamIdsFromTable = await prepareQuery(UpstreamModel, {
    ...queryToFindUpstreamIdsFromTable,
    attributes: ['id'],
  });

  if (!queryToFilterUpstream) {
    return sqlToFindUpstreamIdsFromTable;
  }

  const sqlToFilterUpstream = await prepareQuery(UpstreamModel, {
    ...queryToFilterUpstream,
    attributes: ['id'],
  });

  return `
    WITH
      found_upstreams AS (${sqlToFindUpstreamIdsFromTable}),
      pre_filtered_upstreams AS (${sqlToFilterUpstream})

    SELECT * FROM found_upstreams 
    INNER JOIN pre_filtered_upstreams 
    USING (id)
  `;
}
