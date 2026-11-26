import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { ReportRunner } from '../../app/report/ReportRunner';

vi.mock('../../app/services/mailConfig', () => ({
  getDefaultFromAddress: vi.fn(() => 'no-reply@tamanu.example'),
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
      runner.getRequestedByUser = vi.fn().mockResolvedValue({ email: 'user@tamanu.example' });
      runner.getReportName = vi.fn().mockResolvedValue('test-report-name');
      return runner;
    };

    it('awaits the email send and passes the failure body as "text"', async () => {
      let sendEmailSettled = false;

      const emailService = {
        sendEmail: vi.fn().mockImplementation(
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

  describe('getReportName', () => {
    const buildRunner = ({ definitionName, countryName }) => {
      const store = {
        models: {
          ReportDefinitionVersion: {
            findByPk: vi.fn().mockResolvedValue({ reportDefinition: { name: definitionName } }),
          },
        },
      };
      const settings = { getAll: vi.fn().mockResolvedValue({ country: { name: countryName } }) };
      return new ReportRunner(
        'report-version-1',
        {},
        {},
        store,
        {},
        {},
        'user-1',
        'csv',
        { duration: '0s', ifRunAtLeast: '0s' },
        settings,
      );
    };

    it('dashes and lower-cases the report and country names', async () => {
      const runner = buildRunner({ definitionName: 'Weekly  Admissions', countryName: 'Utopia' });
      expect(await runner.getReportName()).toMatch(/^report-\d{8}-weekly-admissions-utopia$/);
    });

    it.each([
      ['../../elsewhere/job', 'Utopia'],
      ['..\\..\\elsewhere\\job', 'Utopia'],
      ['job\0name', 'Uto/../pia'],
    ])('keeps %j with country %j to a single file name', async (definitionName, countryName) => {
      const reportName = await buildRunner({ definitionName, countryName }).getReportName();
      expect(reportName).not.toMatch(/[/\\\0]/);
      expect(path.dirname(path.join('/reports', `${reportName}.zip`))).toBe('/reports');
    });
  });
});
