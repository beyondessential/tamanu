import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { FHIR_INTERACTIONS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirMaterialiser extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.fhirMaterialiser;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
    this.models = context.store.models;

    // run once on startup
    this.runImmediately();
  }

  getName() {
    return 'FhirMaterialiser';
  }

  async countQueue() {
    let total = await this.models.FhirMaterialiseJob.countQueued();
    for (const Resource of materialisableResources) {
      log.debug(`FhirMaterialiser: Counting missing records for ${Resource.fhirName}`);
      total += await Resource.countMissingRecords();
    }

    return total;
  }

  async run() {
    const { FhirMaterialiseJob } = this.models;
    const { limit } = this.config;
    let total = 0;
    if (!Number.isFinite(limit)) {
      throw new Error('config.schedules.fhirMaterialiser.limit must be finite');
    }

    log.debug('FhirMaterialiser: Running through explicit queue');
    const [completed, failed] = await FhirMaterialiseJob.lockAndRun(
      limit,
      ({ resource, upstreamId }) => {
        const Resource = materialisableResources.find(r => r.fhirName === resource);
        this.materialise(
          log.child({ nth: total, limit, resource, upstreamId }),
          Resource,
          upstreamId,
        );
      },
    );
    total += completed.length + failed.length;
    log.debug('FhirMaterialiser: Finished locking and running FhirMaterialiseJob jobs', {
      limit,
      total,
      completed: completed.map(c => c.id).join(','),
      failed: failed.map(f => f.id).join(','),
    });

    log.debug('FhirMaterialiser: Running through backlog');
    for (const Resource of materialisableResources) {
      if (total >= limit) return;

      const missing = await Resource.findMissingRecordsIds(limit - total);

      for (const id of missing) {
        total += 1;
        await this.materialise(
          log.child({ nth: total, limit, resource: Resource.fhirName, upstreamId: id }),
          Resource,
          id,
        );
      }
    }

    log.debug('FhirMaterialiser: Running resolve upstreams procedure');
    await materialisableResources[0].resolveUpstreams();
  }

  async materialise(logger, Resource, upstreamId) {
    logger.debug('FhirMaterialiser: Starting materialise');
    const start = +new Date();
    const result = await Resource.materialiseFromUpstream(upstreamId);
    logger.debug('FhirMaterialiser: Done materialising', {
      resourceId: result.id,
      versionId: result.versionId,
      duration: +new Date() - start,
    });
  }
}
