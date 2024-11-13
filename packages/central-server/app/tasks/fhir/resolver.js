import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';

export async function resolver(_, { log, models }) {
  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  log.debug('Starting resolve');
  for (const Resource of materialisableResources) {
    await Resource.resolveUpstreams();
  }
  log.debug('Done resolving');
}
