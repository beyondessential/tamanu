import config from 'config';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

export class AutomaticLabTestResultPublisher extends ScheduledTask {
  getName() {
    return 'AutomaticLabTestResultPublisher';
  }

  constructor(context, overrideConfig = null) {
    // TODO: use db config fetcher. (Constructor cannot be async)
    const { schedule, results } =
      overrideConfig || config.schedules.automaticLabTestResultPublisher;
    super(schedule, log);
    this.results = results;
    this.limit = config.limit;
    this.models = context.store.models;
    this.lastRunCount = 0;
  }

  async run() {
    // get relevant ids from config
    const labTestIds = Object.keys(this.results);

    // get all pending lab tests with a relevant id
    const tests = await this.models.LabTest.findAll({
      where: {
        result: '',
        labTestTypeId: labTestIds,
        '$labRequest.status$': LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      },
      include: ['labTestType', 'labRequest'],
      limit: this.limit,
    });

    this.lastRunCount = tests.length;
    if (this.lastRunCount === 0) {
      log.info('No lab tests to publish.');
      return;
    }

    log.info(`Auto-publishing ${this.lastRunCount} lab tests...`);

    for (const test of tests) {
      const { labRequest, labTestType } = test;
      try {
        // transaction just exists on any model, nothing specific to LabTest happening on this line
        await this.models.LabTest.sequelize.transaction(async () => {
          // get the appropriate result info for this test
          const resultData = this.results[labTestType.id];

          // update test with result + method ID
          await test.update({
            labTestMethodId: resultData.labTestMethodId,
            result: resultData.result,
            completedDate: labRequest.requestedDate,
          });

          // publish the lab request (where it will be picked up by certificate notification if relevant)
          await labRequest.update({
            status: LAB_REQUEST_STATUSES.PUBLISHED,
          });

          // Create a log entry for the lab request status
          await this.models.LabRequestLog.create({
            status: labRequest.status,
            labRequestId: labRequest.id,
            updatedById: labRequest.requestedById,
          });

          log.info(`Auto-published lab request ${labRequest.id} (${labRequest.displayId})`);
        });
      } catch (e) {
        log.error(
          `Couldn't auto-publish lab request ${labRequest.id} (${labRequest.displayId})`,
          e,
        );
      }
    }
  }
}
