import { WorkerTask } from 'shared/tasks';
import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirRefreshEntireResource extends WorkerTask {
  async doWork({ payload }) {
    const { resource } = payload;

    this.log.debug('Finding resource by name', { resource });
    const Resource = materialisableResources.find(({ fhirName }) => fhirName === resource);
    if (!Resource) {
      throw new Error(`FhirRefreshFromUpstream: No materialisable resource found for ${resource}`);
    }

    const total = await Resource.UpstreamModel.count();
    this.log.info('Submitting jobs to refresh entire resource', {
      total,
      resource,
    });

    // Manually insert jobs in a single query, rather than using Job.submit(),
    // to save on time and memory (pulling all of upstream's IDs). Also because
    // sequelize can't do streaming queries, so doing it correctly in JS would
    // be a huge pain.
    await this.sequelize.query(
      `INSERT INTO jobs (topic, payload)
      SELECT
        $topic as topic,
        json_build_object(
          'resource', $resource,
          'upstreamId', id
        ) as payload
      FROM $table`,
      {
        bind: {
          topic: JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM,
          resource,
          table: Resource.UpstreamModel.tableName,
        },
      },
    );
  }
}
