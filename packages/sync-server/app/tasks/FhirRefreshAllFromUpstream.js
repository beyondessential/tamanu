import { WorkerTask } from 'shared/tasks';
import { FHIR_INTERACTIONS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
const materialisableResources = resourcesThatCanDo(FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

export class FhirRefreshAllFromUpstream extends WorkerTask {
  async doWork({ payload }) {
    const { table, op, id } = payload;

    const resources = materialisableResources.filter(resource =>
      resource.upstreams.some(upstream => upstream.tableName.toLowerCase() === table.toLowerCase()),
    );
    if (resources.length === 0) {
      this.log.warn('FhirRefreshAllFromUpstream: No materialisable FHIR resource found for table', {
        table,
      });
      return;
    }

    const submits = [];
    for (const Resource of resources) {
      this.log.debug('FhirRefreshAllFromUpstream: finding upstream', {
        resource: Resource.fhirName,
        table,
      });

      // TODO the difficult part: find the upstream from the table+id that was changed
      // - if it's a delete... might not be entirely possible sob
      //   - maybe use args? hmm

      submits.push(
        this.models.Job.submit('fhir.refresh.fromUpstream', {
          resource: Resource.fhirName,
          upstreamId,
          table,
          op,
        }, { discriminant: `${Resource.fhirName}:${upstreamId}` }),
      );
    }

    await Promise.all(submits);
  }
}
