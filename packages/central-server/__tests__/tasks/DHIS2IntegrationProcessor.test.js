import { createTestContext } from '../utilities';
import { DHIS2IntegrationProcessor } from '../../app/tasks/Dhis2IntegrationProcessor';
import { REPORT_DB_SCHEMAS, SETTINGS_SCOPES } from '@tamanu/constants';
import { randomUser } from '@tamanu/database/demoData/patients';

const mockSuccessfulResponse = {
  status: 'SUCCESS',
  message: 'Data values imported successfully',
  httpStatusCode: 200,
  response: { importCount: { imported: 5, updated: 0, ignored: 0 } },
};

const mockSuccess = jest.fn().mockResolvedValue(mockSuccessfulResponse);

const mockFailedResponse = {
  status: 'FAILED',
  message: 'Data values import failed',
  httpStatusCode: 500,
  response: { importCount: { imported: 0, updated: 0, ignored: 0 } },
};

const mockFailed = jest.fn().mockResolvedValue(mockFailedResponse);
const testConfig = {
  enabled: true,
  schedule: '0 0 0 0 0',
};

describe('DHIS2 integration processor', () => {
  let ctx;
  let models;
  let dhis2IntegrationProcessor;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    // TODO: testConfig a bit of a hack
    dhis2IntegrationProcessor = new DHIS2IntegrationProcessor(ctx, testConfig);
  });

  afterAll(() => ctx.close());

  it.should('check that all reports to be processed exist', async () => {
    const testReport = await models.ReportDefinition.create({
      name: 'Test Report',
      dbSchema: REPORT_DB_SCHEMAS.RAW,
    });

    const testReportVersion = await models.ReportDefinitionVersion.create({
      versionNumber: 1,
      reportDefinitionId: testReport.id,
      status: 'published',
      userId: randomUser(models),
    });

    await models.Setting.set(
      'integrations.dhis2.reportIds',
      [testReportVersion.id],
      SETTINGS_SCOPES.CENTRAL,
    );

    await dhis2IntegrationProcessor.run();
  });

  // it('should skip if missing host, username, or password', async () => {
  //   await dhis2IntegrationProcessor.run();
  // });

  // it('should call postToDHIS2 when processing reports', async () => {
  //   dhis2IntegrationProcessor.postToDHIS2 = mockSuccess;

  //   // Set up test data
  //   await models.Setting.set(
  //     'integrations.dhis2.host',
  //     'https://test.dhis2.org',
  //     SETTINGS_SCOPES.CENTRAL,
  //   );

  //   await dhis2IntegrationProcessor.run();

  //   // Verify postToDHIS2 was called
  //   expect(mockSuccess).toHaveBeenCalled();
  // });
});
