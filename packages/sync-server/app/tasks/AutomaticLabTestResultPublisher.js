import config from 'config';
import { LAB_REQUEST_STATUSES, LAB_TEST_STATUSES } from 'shared/constants';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';


export class AutomaticLabTestResultPublisher extends ScheduledTask {
  getName() {
    return 'AutomaticLabTestResultPublisher';
  }

  constructor(context) {
    const { schedule, results } = config.integrations.automaticLabTestResultPublisher;
    super(schedule, log);
    this.results = results;
    this.models = context.store.models;
  }

  async run() {

    // get relevant ids from config
    const labTestIds = Object.keys(this.results);

    // get all pending lab tests with a relevant id
    const tests = await models.LabTestType.findAll({
      where: {
        status: LAB_TEST_STATUSES.RECEPTION_PENDING,
        ['labTestType.id']: [labTestIds],
      },
      include: ['labTestType', 'labRequest'],
    });

    const count = tests.length;
    if (count === 0) {
      log.info('No lab tests to publish.');
      return;
    }

    log.info(
      `Auto-publishing ${count} lab tests...`,
    );

    for (const test of tests) {
      try {
        await transaction(async () => {
          const { labRequest, labTestType } = test;

          var resultData = this.results[labTestType.id];

          // update test with result + method ID
          await test.update({
            labTestMethodId: resultData.methodId,
            result: resultData.result,
            completedDate: new Date(),
          });

          // publish the report
          await labRequest.update({
            status: LAB_REQUEST_STATUSES.PUBLISHED,
          });

          log.info(`Auto-published lab request ${labRequest.id} (${labRquest.displayId})`);
        });
      } catch (e) {
        log.error(`Couldn't auto-publish lab request ${labRequest.id} (${labRquest.displayId})`, e);
      }
    }
  }
}
