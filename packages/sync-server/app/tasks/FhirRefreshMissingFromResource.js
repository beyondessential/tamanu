import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirRefreshMissingFromResources extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.fhirRefreshMissingFromResources;
    super(conf.schedule, log.child({ task: 'FhirRefreshMissingFromResources' }));
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'FhirRefreshMissingFromResources';
  }

  async run() {
    const QUERY = `
      FROM $upstreamTable up
      LEFT JOIN $resourceTable r ON r.upstream_id = up.id
      WHERE r.id IS NULL
    `;

    for (const Resource of materialisableResources) {
      const [{ total }] = await this.sequelize.query(`SELECT COUNT(up.id) as total ${QUERY}`, {
        bind: {
          upstreamTable: Resource.UpstreamModel.tableName,
          resourceTable: Resource.tableName,
        },
      });
      if (total === 0) {
        this.log.debug('No missing resources to refresh', { resource: Resource.fhirName });
        continue;
      }

      this.log.info('Submitting jobs to refresh missing resources', {
        total,
        resource: Resource.fhirName,
        upstream: Resource.UpstreamModel.tableName,
      });

      await this.sequelize.query(
        `
        INSERT INTO jobs (topic, payload)
        SELECT
          $topic as topic,
          json_build_object(
            'resource', $resource,
            'upstreamId', up.id
          ) as payload
        ${QUERY}
        `,
        {
          bind: {
            topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
            resource: Resource.fhirName,
            resourceTable: Resource.tableName,
            upstreamTable: Resource.UpstreamModel.tableName,
          },
        },
      );
    }
  }
}
