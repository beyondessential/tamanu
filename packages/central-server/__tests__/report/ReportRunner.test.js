import { describe, expect, it, vi } from 'vitest';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';
import { ReportRunner } from '../../app/report/ReportRunner';

vi.mock('../../app/services/mailConfig', () => ({
  getDefaultFromAddress: vi.fn(() => 'no-reply@tamanu.example'),
}));

vi.mock('../../app/localisation', () => ({
  getLocalisation: vi.fn(async () => ({ country: { name: 'Samoa' } })),
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

  describe('survey name', () => {
    const SURVEY_ID = 'program-test-survey';

    const buildRunner = ({ reportDefinitionId, reportName, surveyName }) => {
      const store = {
        models: {
          ReportDefinitionVersion: {
            findByPk: vi.fn(async () => ({
              reportDefinitionId,
              reportDefinition: { id: reportDefinitionId, name: reportName },
            })),
          },
          Survey: {
            findByPk: vi.fn(async id =>
              id === SURVEY_ID && surveyName ? { id, name: surveyName } : null,
            ),
          },
        },
      };
      const runner = new ReportRunner(
        'report-version-1',
        { surveyId: SURVEY_ID, village: 'village-1' },
        { email: ['recipient@tamanu.example'] },
        store,
        {},
        {},
        'user-1',
        'xlsx',
        { duration: '0s', ifRunAtLeast: '0s' },
      );
      runner.getRequestedByUser = vi.fn().mockResolvedValue({ email: 'user@tamanu.example' });
      return runner;
    };

    const genericSurveyExport = {
      reportDefinitionId: GENERIC_SURVEY_EXPORT_REPORT_ID,
      reportName: 'Generic Survey Export - Line List',
      surveyName: 'Patient Information',
    };

    it('puts the survey name between the report name and the country name', async () => {
      const runner = buildRunner(genericSurveyExport);

      const reportName = await runner.getReportName();

      expect(reportName).toMatch(
        /^report-\d{8}-generic-survey-export-line-list-patient-information-samoa$/,
      );
    });

    it('adds a Survey row directly after Filters on the metadata tab', async () => {
      const runner = buildRunner(genericSurveyExport);

      const metadata = await runner.getMetadata();

      const labels = metadata.map(([label]) => label);
      expect(labels).toEqual(['Report Name:', 'Date Generated:', 'User:', 'Filters:', 'Survey:']);
      expect(metadata[3][1]).toContain(`surveyId: ${SURVEY_ID}`);
      expect(metadata[4][1]).toBe('Patient Information');
    });

    it('leaves the name and metadata of other reports unchanged', async () => {
      const runner = buildRunner({
        reportDefinitionId: 'some-other-report',
        reportName: 'Admissions Report',
        surveyName: 'Patient Information',
      });

      const reportName = await runner.getReportName();
      const metadata = await runner.getMetadata();

      expect(reportName).toMatch(/^report-\d{8}-admissions-report-samoa$/);
      expect(metadata.map(([label]) => label)).not.toContain('Survey:');
      expect(runner.store.models.Survey.findByPk).not.toHaveBeenCalled();
    });

    it('falls back to the name without a survey when the survey cannot be found', async () => {
      const runner = buildRunner({ ...genericSurveyExport, surveyName: null });

      const reportName = await runner.getReportName();

      expect(reportName).toMatch(/^report-\d{8}-generic-survey-export-line-list-samoa$/);
    });
  });
});
