import config from 'config';
import { FHIR_INTERACTIONS, JOB_PRIORITIES, JOB_TOPICS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { prepareQuery } from '../utils/prepareQuery';
import { Op } from 'sequelize';

export class FhirMissingResources extends ScheduledTask {
  constructor(context, overrideConfig = null) {
    const conf = { ...config.schedules.fhirMissingResources, ...overrideConfig };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log.child({ task: 'FhirMissingResources' }), jitterTime, enabled);
    this.config = conf;
    this.context = context;
    this.materialisableResources = resourcesThatCanDo(
      this.context.store.models,
      FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    );
  }

  getName() {
    return 'FhirMissingResources';
  }

  async getQueryToFilterUpstream(Resource, UpstreamModel) {
    const { created_after } = this.config;

    const upstreamTable = UpstreamModel.tableName;
    const baseQueryToFilterUpstream = await Resource.queryToFilterUpstream(upstreamTable);

    if (!created_after) {
      return baseQueryToFilterUpstream;
    }

    // Filter by created_at >= created_after
    const queryToFilterUpstream = { ...baseQueryToFilterUpstream };
    queryToFilterUpstream.where = {
      ...baseQueryToFilterUpstream?.where,
      created_at: { [Op.gte]: created_after },
    };

    return queryToFilterUpstream;
  }

  async countQueue() {
    let all = 0;

    for (const Resource of this.materialisableResources) {
      const resourceTable = Resource.tableName;

      for (const UpstreamModel of Resource.UpstreamModels) {
        const queryToFilterUpstream = await this.getQueryToFilterUpstream(Resource, UpstreamModel);
        const sql = await prepareQuery(UpstreamModel, {
          ...queryToFilterUpstream,
          attributes: ['id'],
        });

        const [[{ total }]] = await Resource.sequelize.query(
          `
          WITH upstream AS (${sql.replace(/;$/, '')})
          SELECT COUNT(upstream.id) as total FROM upstream
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = upstream.id
          WHERE r.id IS NULL`,
        );

        all += parseInt(total);
      }
    }

    return all;
  }

  async run() {
    for (const Resource of this.materialisableResources) {
      const resourceTable = Resource.tableName;
      for (const UpstreamModel of Resource.UpstreamModels) {
        const queryToFilterUpstream = await this.getQueryToFilterUpstream(Resource, UpstreamModel);
        const sql = await prepareQuery(UpstreamModel, {
          ...queryToFilterUpstream,
          attributes: ['id'],
        });

        const [[{ total }]] = await Resource.sequelize.query(
          `
          WITH upstream AS (${sql.replace(/;$/, '')})
          SELECT COUNT(upstream.id) as total FROM upstream
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = upstream.id
          WHERE r.id IS NULL`,
        );
        if (total === 0) {
          this.log.debug('No missing resources to refresh', { resource: Resource.fhirName });
          continue;
        }

        this.log.info('Submitting jobs to refresh missing resources', {
          total,
          resource: Resource.fhirName,
          upstream: UpstreamModel.tableName,
        });

        await Resource.sequelize.query(
          `
          WITH upstream AS (${sql.replace(/;$/, '')})
          INSERT INTO fhir.jobs (topic, payload, priority)
          SELECT
            $topic::text as topic,
            json_build_object(
              'resource', $resource::text,
              'upstreamId', upstream.id
            ) as payload,
            $priority::int as priority
          FROM upstream
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = upstream.id
          WHERE r.id IS NULL`,
          {
            bind: {
              topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
              resource: Resource.fhirName,
              priority: JOB_PRIORITIES.LOW, // Ensure MissingResource jobs come in as low priority so they don't clog up the job queue
            },
          },
        );
      }
    }
  }
}
