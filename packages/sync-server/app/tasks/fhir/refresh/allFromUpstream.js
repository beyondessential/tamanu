import { Sequelize } from 'sequelize';
import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export async function allFromUpstream({ payload }, { log, sequelize }) {
  const { table, op, id, deletedRow = null } = payload;

  const resources = materialisableResources.filter(resource =>
    resource.upstreams.some(upstream => upstream.tableName.toLowerCase() === table.toLowerCase()),
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

    const query = await Resource.queryToFindUpstreamIdsFromTable(table, id, deletedRow);
    if (!query) {
      log.debug('no upstream found for row', {
        resource: Resource.fhirName,
        table,
        id,
        op,
      });
      continue;
    }

    const sql = Resource.UpstreamModel.QueryGenerator.selectQuery(
      Resource.UpstreamModel.getTableName(),
      {
        ...query,
        attributes: [
          Sequelize.cast(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, 'text'),
          Sequelize.fn(
            'json_build_object',
            'resource',
            Resource.fhirName,
            'upstreamId',
            Sequelize.col('id'),
            'table',
            table,
            'op',
            op,
          ),
          Sequelize.fn('concat', Resource.fhirName, ':', Sequelize.col('id')),
        ],
      },
    );
    await worker.setHandler('test', WorkerTest);

    const results = await sequelize.query(
      `INSERT INTO fhir.jobs (name, payload, discriminant)
        ${sql}
        ON CONFLICT (discriminant) DO NOTHING`,
      {
        type: Sequelize.QueryTypes.INSERT,
      },
    );
    if (!results) {
      throw new Error(`Failed to insert jobs: ${JSON.stringify(results)}`);
    }

    log.debug('submitted refresh jobs', {
      resource: Resource.fhirName,
      count: results[1],
    });
  }
}
