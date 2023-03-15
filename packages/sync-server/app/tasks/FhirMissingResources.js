import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirMissingResources extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.fhirMissingResources;
    super(conf.schedule, log.child({ task: 'FhirMissingResources' }));
    this.config = conf;
    this.context = context;
    this.runImmediately();
  }

  getName() {
    return 'FhirMissingResources';
  }

  async countQueue() {
    let all = 0;

    for (const Resource of materialisableResources) {
      const resourceTable = Resource.tableName;
      const upstreamTable = Resource.UpstreamModel.tableName;

      const [{ total }] = await Resource.sequelize.query(
        `SELECT COUNT(up.id) as total FROM "${upstreamTable}" up
        LEFT JOIN fhir."${resourceTable}" r ON r.upstream_id = up.id
        WHERE r.id IS NULL`,
      );
      all += total;
    }

    return all;
  }

  async run() {
    for (const Resource of materialisableResources) {
      const resourceTable = Resource.tableName;
      const upstreamTable = Resource.UpstreamModel.tableName;

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
        upstream: Resource.UpstreamModel.tableName,
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
