import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';
import { ReportRequestProcessor } from '../../app/tasks/ReportRequestProcessor';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/fake-data/fake';

jest.mock('@tamanu/shared/reports', () => {
  return {
    __esModule: true,
    getReportModule: jest.fn().mockReturnValue({
      dataGenerator: jest.fn().mockReturnValue('report data'),
    }),
  };
});

describe('ReportRequestProcessor', () => {
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
      signal.forEach((s) => {
        processEvents[s] = cb;
      });
    };
    process.kill = (pid, signal) => {
      processEvents[signal](signal);
    };
    const processor = new ReportRequestProcessor(ctx);
    expect(processEvents).toEqual({
      uncaughtException: expect.any(Function),
      SIGINT: expect.any(Function),
      SIGTERM: expect.any(Function),
    });

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
    expect(mockChildProcess.kill).toHaveBeenCalledWith(childProcessId, 'SIGINT');
  });
});
