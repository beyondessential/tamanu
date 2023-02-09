import { WorkerTask } from 'shared/tasks';

export class WorkerTest extends WorkerTask {
  async doWork(job) {
    if (job.payload.error) {
      throw new Error('WorkerTest: error');
    }

    this.log.info('WorkerTest: success', job.payload);
  }
}
