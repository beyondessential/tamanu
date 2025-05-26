import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

export async function resolver(_, { log, sequelize, models }) {
  await sleepAsync(3000); // sleep for 3 seconds to allow materialisation jobs to complete

  const materialisableResources = resourcesThatCanDo(
    models,
    FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
  );

  log.debug('Starting resolve');
  await sequelize.transaction(async () => {
    for (const Resource of materialisableResources) {
      await Resource.resolveUpstreams();
    }
  });

  log.debug('Done resolving');
}
