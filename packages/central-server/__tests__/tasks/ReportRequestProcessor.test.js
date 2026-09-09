import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';
import { ReportRequestProcessor } from '../../app/tasks/ReportRequestProcessor';
import { createTestContext } from '../utilities';
import { fake } from '@tamanu/fake-data/fake';

vi.mock('@tamanu/shared/reports', () => {
  return {
    getReportModule: vi.fn().mockReturnValue({
      dataGenerator: vi.fn().mockReturnValue('report data'),
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
    vi.restoreAllMocks();
    vi.clearAllMocks();
    await ctx.close();
  });

  it('should attempt to exit all child process when parent process exits', async () => {
    const processEvents = {};
    const { ReportRequest } = ctx.store.models;
    vi.spyOn(process, 'on').mockImplementation((event, cb) => {
      processEvents[event] = cb;
    });
    vi.spyOn(process, 'off').mockImplementation(event => {
      delete processEvents[event];
    });
    vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
      processEvents[signal](signal);
    });
    const processor = new ReportRequestProcessor(ctx);
    expect(processEvents).toEqual({
      uncaughtExceptionMonitor: expect.any(Function),
      SIGINT: expect.any(Function),
      SIGTERM: expect.any(Function),
    });

    const childProcessId = fakeUUID();
    const mockChildProcess = {
      kill: vi.fn(),
      killed: false,
      pid: childProcessId,
    };
    processor.spawnReportProcess = vi.fn().mockImplementationOnce(() => {
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
    expect(mockChildProcess.kill).toBeCalledWith('SIGINT');

    processor.cancelPolling();
    expect(processEvents).toEqual({});
  });
});
