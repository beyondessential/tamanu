import { WorkerTask } from 'shared/tasks';

export class FhirRefreshResolver extends WorkerTask {
  async doWork() {
    this.log.debug('Running FHIR upstream resolver');
    await this.sequelize.query('CALL fhir.resolve_upstreams()');
  }
}
