import { FHIR_INTERACTIONS, JOB_TOPICS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export async function fromUpstream(
  { payload: { resource, upstreamId, options = {} } },
  { log, models: { FhirJob } },
) {
  log.debug('Finding resource by name', { resource });
  const Resource = materialisableResources.find(({ fhirName }) => fhirName === resource);
  if (!Resource) {
    throw new Error(`FhirRefreshFromUpstream: No materialisable resource found for ${resource}`);
  }

  log.debug('Starting materialise', { resource, upstreamId });
  const result = await Resource.materialiseFromUpstream(upstreamId, options);
  log.debug('Done materialising', {
    resource,
    upstreamId,
    resourceId: result.id,
    versionId: result.versionId,
    options,
  });

  await FhirJob.submit(
    JOB_TOPICS.FHIR.RESOLVER,
    {},
    {
      discriminant: 'one at a time',
    },
  );
}
