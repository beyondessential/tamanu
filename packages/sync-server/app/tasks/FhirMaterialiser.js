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
    let total = 0;

    log.debug('FhirMaterialiser: Running through explicit queue');
    const [completed, failed] = await FhirMaterialiseJob.lockAndRun(
      async ({ resource, upstreamId }) => {
        const Resource = materialisableResources.find(r => r.fhirName === resource);
        await this.materialise(
          log.child({ nth: total, resource, upstreamId }),
          Resource,
          upstreamId,
        );
      },
    );
    total += completed.length + failed.length;
    const completedIds = completed.map(f => f.id).join(',');
    const failedIds = failed.map(f => f.id).join(',');
    if (failed.length > 0) {
      log.error('FhirMaterialiser: FhirMaterialiseJob: Some jobs failed', {
        total,
        failedIds,
        completedIds,
        hint:
          'Try running `SELECT id, resource, upstream_id, error FROM fhir_materialise_jobs WHERE ids IN (?)`',
      });
    } else {
      log.debug('FhirMaterialiser: FhirMaterialiseJob: All jobs completed successfully', {
        total,
        completedIds,
      });
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
