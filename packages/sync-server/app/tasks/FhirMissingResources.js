import config from 'config';
import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';

export class FhirMissingResources extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.fhirMissingResources;
    super(conf.schedule, log.child({ task: 'FhirMissingResources' }));
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

  async countQueue() {
    let all = 0;

    for (const Resource of this.materialisableResources) {
      const resourceTable = Resource.tableName;

      for (const UpstreamModel of Resource.UpstreamModels) {
        const upstreamTable = UpstreamModel.tableName;

        const [{ total }] = await Resource.sequelize.query(
          `SELECT COUNT(up.id) as total FROM "${upstreamTable}" up
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = up.id
          WHERE r.id IS NULL`,
        );
        all += total;
      }
    }

    return all;
  }

  async run() {
    for (const Resource of this.materialisableResources) {
      const resourceTable = Resource.tableName;
      for (const UpstreamModel of Resource.UpstreamModels) {
        const upstreamTable = UpstreamModel.tableName;

        const [{ total }] = await Resource.sequelize.query(
          `SELECT COUNT(up.id) as total FROM "${upstreamTable}" up
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = up.id
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
          `INSERT INTO fhir.jobs (topic, payload)
          SELECT
            $topic::text as topic,
            json_build_object(
              'resource', $resource::text,
              'upstreamId', up.id
            ) as payload
          FROM "${upstreamTable}" up
          LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = up.id
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
