import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';

export async function fromUpstream({ payload: { resource, upstreamId } }, { log, models, settings }) {
  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );
  log.debug('Finding resource by name', { resource });
  const Resource = materialisableResources.find(({ fhirName }) => fhirName === resource);
  if (!Resource) {
    throw new Error(`FhirRefreshFromUpstream: No materialisable resource found for ${resource}`);
  }

  log.debug('Starting materialise', { resource, upstreamId });
  const result = await Resource.materialiseFromUpstream(upstreamId, settings);
  log.debug('Done materialising', {
    resource,
    upstreamId,
    resourceId: result.id,
    versionId: result.versionId,
  });

  const { FhirJob } = models;
  await FhirJob.submit(
    JOB_TOPICS.FHIR.RESOLVER,
    {},
    {
      discriminant: 'one at a time',
    },
  );
}
