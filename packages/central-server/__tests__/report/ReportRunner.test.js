import { ReportRunner } from '../../app/report/ReportRunner';

jest.mock('../../app/services/mailConfig', () => ({
  getDefaultFromAddress: jest.fn(() => 'no-reply@tamanu.example'),
}));

describe('ReportRunner', () => {
  describe('sendErrorToEmail', () => {
    const buildRunner = emailService => {
      const runner = new ReportRunner(
        'test-report',
        {},
        { email: ['recipient@tamanu.example'] },
        {},
        {},
        emailService,
        'user-1',
        'csv',
        { duration: '0s', ifRunAtLeast: '0s' },
      );
      runner.getRequestedByUser = jest.fn().mockResolvedValue({ email: 'user@tamanu.example' });
      runner.getReportName = jest.fn().mockResolvedValue('test-report-name');
      return runner;
    };

    it('awaits the email send and passes the failure body as "text"', async () => {
      let sendEmailSettled = false;

      const emailService = {
        sendEmail: jest.fn().mockImplementation(
          () =>
            new Promise(resolve => {
              setImmediate(() => {
                sendEmailSettled = true;
                resolve({ status: 'Sent' });
              });
            }),
        ),
      };

      const runner = buildRunner(emailService);

      await runner.sendErrorToEmail(new Error('report blew up'));

      // If sendErrorToEmail failed to await emailService.sendEmail, this would still be false
      // here, since the microtask queued by setImmediate would not yet have run.
      expect(sendEmailSettled).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const [emailArgs] = emailService.sendEmail.mock.calls[0];
      expect(emailArgs).not.toHaveProperty('message');
      expect(emailArgs.text).toContain('test-report-name');
      expect(emailArgs.text).toContain('report blew up');
    });
  });
});
