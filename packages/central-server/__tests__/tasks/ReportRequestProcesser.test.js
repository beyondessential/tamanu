import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { fakeUUID } from '../../../shared/src/utils';
import { ReportRequestProcessor } from '../../app/tasks/ReportRequestProcessor';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/shared/test-helpers';

jest.mock('@tamanu/shared/reports', () => {
  return {
    __esModule: true,
    getReportModule: jest.fn().mockReturnValue({
      dataGenerator: jest.fn().mockReturnValue('report data'),
    }),
  };
});

describe('ReportRequestProcesser', () => {
  let ctx;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    const { User } = ctx.store.models;
    user = await User.create(fake(User));
  });
  afterAll(async () => {
    jest.clearAllMocks();
    await ctx.close();
  });

  it('should attempt to exit all child process when parent process exits', async () => {
    const processEvents = {};
    const { ReportRequest } = ctx.store.models;
    process.on = (signal, cb) => {
      processEvents[signal] = cb;
    };
    process.kill = (pid, signal) => {
      processEvents[signal](signal);
    };
    const processor = new ReportRequestProcessor(ctx);
    expect(processEvents).toEqual(
      expect.objectContaining({
        SIGINT: expect.any(Function),
        SIGTERM: expect.any(Function),
        uncaughtException: expect.any(Function),
      }),
    );

    const childProcessId = fakeUUID();
    const mockChildProcess = {
      kill: jest.fn(),
      killed: false,
      pid: childProcessId,
    };
    processor.spawnReportProcess = jest.fn().mockImplementationOnce(() => {
      processor.childProcesses.set(childProcessId, mockChildProcess);
    });
    await ReportRequest.create({
      status: REPORT_REQUEST_STATUSES.RECEIVED,
      recipients: 'admin@tamanu.io',
      exportFormat: 'csv',
      reportType: 'dummy',
      requestedByUserId: user.id,
    });
    await processor.runReports();
    expect(processor.childProcesses.size).toBe(1);
    process.kill(process.pid, 'SIGINT');
    expect(mockChildProcess.kill).toBeCalledWith(childProcessId, 'SIGINT');
  });
});
