import config from 'config';
import { pick } from 'lodash';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

const arrayOfArraysToCSV = reportData => utils.sheet_to_csv(utils.aoa_to_sheet(reportData));

export const INFO_LOGS = {
  SENDING_REPORTS: 'DHIS2IntegrationProcessor: Sending reports to DHIS2',
  PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Processing report',
  SUCCESSFULLY_SENT_REPORT: 'DHIS2IntegrationProcessor: Report sent to DHIS2 successfully',
  COMPLETING_DATA_SETS: 'DHIS2IntegrationProcessor: Completing data sets in DHIS2',
  SUCCESSFULLY_COMPLETED_DATA_SETS:
    'DHIS2IntegrationProcessor: Data sets completed successfully',
};

export const WARNING_LOGS = {
  INTEGRATION_NOT_CONFIGURED:
    'DHIS2IntegrationProcessor: DHIS2 integration not properly configured, skipping',
  REPORT_DOES_NOT_EXIST: "DHIS2IntegrationProcessor: Report doesn't exist, skipping",
  REPORT_HAS_NO_PUBLISHED_VERSION:
    'DHIS2IntegrationProcessor: Report has no published version, skipping',
  FAILED_TO_SEND_REPORT: 'DHIS2IntegrationProcessor: Failed to send report to DHIS2',
  FAILED_TO_COMPLETE_DATA_SETS: 'DHIS2IntegrationProcessor: Failed to complete data sets',
  NO_DATA_SETS_TO_COMPLETE: 'DHIS2IntegrationProcessor: No data sets to complete in report',
};

export const ERROR_LOGS = {
  ERROR_PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Error processing report',
};

export const AUDIT_STATUSES = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  WARNING: 'warning',
};

// Fields from the DHIS2PushLog model to show in the logger
export const LOG_FIELDS = [
  'reportId',
  'status',
  'message',
  'imported',
  'updated',
  'ignored',
  'deleted',
  'dataSetsCompleted',
  'dataSetCompletionErrors',
];

// Designed to post to a DHIS2 instance using the API https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-239/data.html#webapi_sending_bulks_data_values
export class DHIS2IntegrationProcessor extends ScheduledTask {
  getName() {
    return 'DHIS2IntegrationProcessor';
  }

  constructor(context) {
    const conf = config.schedules.dhis2IntegrationProcessor;
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.context = context;
  }

  async logDHIS2Push({
    reportId,
    status,
    importCount = {},
    conflicts = [],
    message,
    dataSetsCompleted,
    dataSetCompletionErrors,
  }) {
    const logEntry = await this.context.store.models.DHIS2PushLog.create({
      reportId,
      status,
      message,
      ...(conflicts.length > 0 && { conflicts }),
      ...importCount,
      ...(dataSetsCompleted !== undefined && { dataSetsCompleted }),
      ...(dataSetCompletionErrors && { dataSetCompletionErrors }),
    });

    return pick(logEntry.get({ plain: true }), LOG_FIELDS);
  }

  extractDataSetRegistrations(reportData) {
    // Parse CSV data to extract unique dataset/period/orgUnit combinations
    // CSV format: dataElement, period, orgUnit, categoryOptionCombo, attributeOptionCombo, value, ...
    // We need to find the dataSet column (if it exists) or use a configuration
    
    if (!reportData || reportData.length < 2) {
      return [];
    }

    const headers = reportData[0].map(h => h?.toLowerCase?.() || '');
    const dataSetIndex = headers.indexOf('dataset');
    const periodIndex = headers.indexOf('period');
    const orgUnitIndex = headers.indexOf('orgunit');

    // If we don't have the required columns, we can't complete datasets
    if (dataSetIndex === -1 || periodIndex === -1 || orgUnitIndex === -1) {
      return [];
    }

    const registrations = new Map();
    
    // Start from index 1 to skip the header row
    for (let i = 1; i < reportData.length; i++) {
      const row = reportData[i];
      const dataSet = row[dataSetIndex];
      const period = row[periodIndex];
      const orgUnit = row[orgUnitIndex];

      if (dataSet && period && orgUnit) {
        const key = `${dataSet}|${period}|${orgUnit}`;
        if (!registrations.has(key)) {
          registrations.set(key, { dataSet, period, orgUnit });
        }
      }
    }

    return Array.from(registrations.values());
  }

  async completeDataSetsInDHIS2(registrations) {
    const { host, backoff } = await this.context.settings.get('integrations.dhis2');
    const { username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const errors = [];
    let completedCount = 0;

    for (const registration of registrations) {
      try {
        const response = await fetchWithRetryBackoff(
          `${host}/api/completeDataSetRegistrations`,
          {
            fetch,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Basic ${authHeader}`,
            },
            body: JSON.stringify({
              completeDataSetRegistrations: [
                {
                  dataSet: registration.dataSet,
                  period: registration.period,
                  organisationUnit: registration.orgUnit,
                  completed: true,
                },
              ],
            }),
          },
          { ...backoff, log },
        );

        const result = await response.json();
        
        if (result.status === 'SUCCESS' || response.status === 200) {
          completedCount++;
        } else {
          errors.push({
            registration,
            error: result.message || 'Unknown error',
          });
        }
      } catch (error) {
        errors.push({
          registration,
          error: error.message,
        });
      }
    }

    return { completedCount, errors };
  }

  async postToDHIS2({ reportId, reportCSV }) {
    const { idSchemes, host, backoff } = await this.context.settings.get('integrations.dhis2');
    const { username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const params = new URLSearchParams({ ...idSchemes, importStrategy: 'CREATE_AND_UPDATE' });
    try {
      const response = await fetchWithRetryBackoff(
        `${host}/api/dataValueSets?${params.toString()}`,
        {
          fetch,
          method: 'POST',
          headers: {
            'Content-Type': 'application/csv',
            Accept: 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: reportCSV,
        },
        { ...backoff, log },
      );

      return await response.json();
    } catch (error) {
      await this.logDHIS2Push({
        reportId,
        status: AUDIT_STATUSES.FAILURE,
        message: error.message,
      });
      throw error;
    }
  }

  async processReport(reportId) {
    const {
      store: { models, sequelize },
    } = this.context;

    const report = await models.ReportDefinition.findByPk(reportId, {
      include: [
        {
          model: models.ReportDefinitionVersion,
          as: 'versions',
          where: { status: REPORT_STATUSES.PUBLISHED },
          order: [['createdAt', 'DESC']],
          limit: 1,
          separate: true,
        },
      ],
    });

    if (!report) {
      log.warn(WARNING_LOGS.REPORT_DOES_NOT_EXIST, { reportId });
      return;
    }

    const reportString = `${report.name} (${reportId})`;

    if (!report.versions || report.versions.length === 0) {
      log.warn(WARNING_LOGS.REPORT_HAS_NO_PUBLISHED_VERSION, {
        report: reportString,
      });
      return;
    }

    log.info(INFO_LOGS.PROCESSING_REPORT, { report: reportString });

    const latestVersion = report.versions[0];
    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const reportCSV = arrayOfArraysToCSV(reportData);

    const {
      message,
      httpStatusCode,
      response: { importCount, conflicts = [] },
    } = await this.postToDHIS2({ reportId, reportCSV });

    if (httpStatusCode === 200) {
      let dataSetsCompleted;
      let dataSetCompletionErrors;

      // Try to complete datasets if auto-completion is enabled
      const { autoCompleteDataSets } = await this.context.settings.get('integrations.dhis2');
      if (autoCompleteDataSets) {
        const registrations = this.extractDataSetRegistrations(reportData);
        
        if (registrations.length > 0) {
          log.info(INFO_LOGS.COMPLETING_DATA_SETS, {
            count: registrations.length,
            report: reportString,
          });

          const { completedCount, errors } = await this.completeDataSetsInDHIS2(registrations);
          dataSetsCompleted = completedCount;
          
          if (errors.length > 0) {
            dataSetCompletionErrors = errors;
            log.warn(WARNING_LOGS.FAILED_TO_COMPLETE_DATA_SETS, {
              report: reportString,
              completed: completedCount,
              failed: errors.length,
              errors,
            });
          } else {
            log.info(INFO_LOGS.SUCCESSFULLY_COMPLETED_DATA_SETS, {
              report: reportString,
              count: completedCount,
            });
          }
        } else {
          log.warn(WARNING_LOGS.NO_DATA_SETS_TO_COMPLETE, {
            report: reportString,
          });
        }
      }

      const successLog = await this.logDHIS2Push({
        reportId,
        status: AUDIT_STATUSES.SUCCESS,
        message,
        importCount,
        dataSetsCompleted,
        dataSetCompletionErrors,
      });

      log.info(INFO_LOGS.SUCCESSFULLY_SENT_REPORT, successLog);
    } else {
      const warningLog = await this.logDHIS2Push({
        reportId,
        status: AUDIT_STATUSES.WARNING,
        message,
        importCount,
        conflicts: conflicts.map(conflict => conflict.value),
      });

      log.warn(WARNING_LOGS.FAILED_TO_SEND_REPORT, warningLog);
      conflicts.forEach(conflict => log.warn(conflict.value));
    }
  }

  async run() {
    const { reportIds, host } = await this.context.settings.get('integrations.dhis2');
    const { enabled, username, password } = config.integrations.dhis2;

    if (!enabled || !host || !username || !password || reportIds.length === 0) {
      log.warn(WARNING_LOGS.INTEGRATION_NOT_CONFIGURED, {
        enabled: !!enabled,
        host: !!host,
        username: !!username,
        password: !!password,
        reportIds: reportIds.length,
      });
      return;
    }

    log.info(INFO_LOGS.SENDING_REPORTS, {
      count: reportIds.length,
    });

    for (const reportId of reportIds) {
      try {
        await this.processReport(reportId);
      } catch (error) {
        log.error(ERROR_LOGS.ERROR_PROCESSING_REPORT, {
          reportId,
          error,
        });
      }
    }
  }
}
