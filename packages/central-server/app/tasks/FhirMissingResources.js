import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { prepareQuery } from '../utils/prepareQuery';

export class FhirMissingResources extends ScheduledTask {
  constructor(context) {
    const { schedules, settings } = context;
    super(schedules.fhirMissingResources.schedule, log.child({ task: 'FhirMissingResources' }));
    this.settings = settings;
    this.context = context;
    this.materialisableResources = resourcesThatCanDo(
      this.context.store.models,
      FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    );
  }

  getName() {
    return 'FhirMissingResources';
  }

  async countQueue() {
    let all = 0;

    for (const Resource of this.materialisableResources) {
      const resourceTable = Resource.tableName;

      for (const UpstreamModel of Resource.UpstreamModels) {
        const upstreamTable = UpstreamModel.tableName;
        const queryToFilterUpstream = await Resource.queryToFilterUpstream(upstreamTable);
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
        const upstreamTable = UpstreamModel.tableName;
        const queryToFilterUpstream = await Resource.queryToFilterUpstream(upstreamTable);
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
          INSERT INTO fhir.jobs (topic, payload)
          SELECT
            $topic::text as topic,
            json_build_object(
              'resource', $resource::text,
              'upstreamId', upstream.id
            ) as payload
          FROM upstream
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = upstream.id
          WHERE r.id IS NULL`,
          {
            bind: {
              topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
              resource: Resource.fhirName,
            },
          },
        );
      }
    }
  }
}
