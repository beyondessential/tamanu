import config from 'config';
import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { FHIR_RESOURCE_TYPES } from 'shared/constants';

// jobs pushed in there are done first (from sync)
const frontQueue = [];
export function fhirQueue(resource, upstreamId) {
  frontQueue.push({ resource, upstreamId });
}

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
    let total = frontQueue.length;
    for (const resource of Object.values(FHIR_RESOURCE_TYPES)) {
      log.debug(`Counting missing records for Fhir${resource}`);
      const Resource = this.models[`Fhir${resource}`];
      total += await Resource.countMissingRecords();
    }

    return total;
  }

  async run() {
    const { limit } = this.config;
    let total = 0;

    for (const { resource, upstreamId } of frontQueue.splice(0, limit)) {
      total += 1;
      await this.materialise(
        log.child({ nth: total, limit, resource, upstreamId }),
        resource,
        upstreamId,
      );
    }

    for (const resource of Object.values(FHIR_RESOURCE_TYPES)) {
      if (total >= limit) return;

      const missing = await this.models[`Fhir${resource}`].findMissingRecordsIds(limit - total);

      for (const id of missing) {
        total += 1;
        await this.materialise(
          log.child({ nth: total, limit, resource, upstreamId: id }),
          resource,
          id,
        );
      }
    }
  }

  async materialise(log, resource, upstreamId) {
    log.debug('Starting materialise');
    const start = +new Date();
    const result = await this.models[`Fhir${resource}`].materialiseFromUpstream(upstreamId);
    log.debug('Done materialising', {
      resourceId: result.id,
      versionId: result.versionId,
      duration: +new Date() - start,
    });
  }
}
