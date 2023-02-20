import { FhirWorkerTask } from 'shared/tasks';

export class FhirWorkerTest extends FhirWorkerTask {
  async doWork(job) {
    if (job.payload.error) {
      throw new Error('FhirWorkerTest: error');
    }

    this.log.info('FhirWorkerTest: success', job.payload);
  }
}
