import { WorkerTask } from 'shared/tasks';
import { FHIR_INTERACTIONS, JOB_SUBMITS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirRefreshFromUpstream extends WorkerTask {
  async doWork({ payload }) {
    const { resource, upstreamId } = payload;

    this.log.debug('Finding resource by name', { resource });
    const Resource = materialisableResources.find(({ fhirName }) => fhirName === resource);
    if (!Resource) {
      throw new Error(`FhirRefreshFromUpstream: No materialisable resource found for ${resource}`);
    }

    this.log.debug('Starting materialise', { resource, upstreamId });
    const result = await Resource.materialiseFromUpstream(upstreamId);
    this.log.debug('Done materialising', {
      resource,
      upstreamId,
      resourceId: result.id,
      versionId: result.versionId,
    });

    await this.models.Job.submit(
      JOB_SUBMITS.FHIR.REFRESH.RESOLVER,
      {},
      {
        discriminant: 'one at a time',
      },
    );
  }
}
