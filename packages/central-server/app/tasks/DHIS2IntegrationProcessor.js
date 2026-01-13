import config from 'config';
import { pick, groupBy, map } from 'lodash';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

const convertToDHIS2DataValueSets = (reportData, options = {}) => {
  const { dataSet = '', completeDate = new Date().toISOString().split('T')[0] } = options;

  const reportJSON = utils.sheet_to_json(utils.aoa_to_sheet(reportData));

  return map(
    groupBy(
      reportJSON,
      row => `${row.period || ''}_${row.orgunit || ''}_${row.attributeoptioncombo || ''}`,
    ),
    rows => ({
      dataSet,
      completeDate,
      period: rows[0].period || '',
      orgUnit: rows[0].orgunit || '',
      attributeOptionCombo: rows[0].attributeoptioncombo || '',
      dataValues: rows.map(row => ({
        dataElement: row.dataelement || '',
        categoryOptionCombo: row.categoryoptioncombo || '',
        value: row.value || '',
        comment: row.comment || '',
      })),
    }),
  );
};

export const INFO_LOGS = {
  SENDING_REPORTS: 'DHIS2IntegrationProcessor: Sending reports to DHIS2',
  PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Processing report',
  SUCCESSFULLY_SENT_REPORT: 'DHIS2IntegrationProcessor: Report sent to DHIS2 successfully',
};

export const WARNING_LOGS = {
  INTEGRATION_NOT_CONFIGURED:
    'DHIS2IntegrationProcessor: DHIS2 integration not properly configured, skipping',
  REPORT_DOES_NOT_EXIST: "DHIS2IntegrationProcessor: Report doesn't exist, skipping",
  REPORT_HAS_NO_PUBLISHED_VERSION:
    'DHIS2IntegrationProcessor: Report has no published version, skipping',
  FAILED_TO_SEND_REPORT: 'DHIS2IntegrationProcessor: Failed to send report to DHIS2',
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

  async logDHIS2Push({ reportId, status, importCount = {}, conflicts = [], message }) {
    const logEntry = await this.context.store.models.DHIS2PushLog.create({
      reportId,
      status,
      message,
      ...(conflicts.length > 0 && { conflicts }),
      ...importCount,
    });

    return pick(logEntry.get({ plain: true }), LOG_FIELDS);
  }

  async postToDHIS2({ reportId, dataValueSet }) {
    const { idSchemes, host, backoff } = await this.context.settings.get('integrations.dhis2');
    const { username, password } = config.integrations.dhis2;
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const params = new URLSearchParams({ ...idSchemes, importStrategy: 'CREATE_AND_UPDATE' });

    try {
      // TODO: why is this 504
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
          body: JSON.stringify(dataValueSet),
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
    const dhis2DataValueSets = convertToDHIS2DataValueSets(reportData);

    for (const dataValueSet of dhis2DataValueSets) {
      const {
        message,
        httpStatusCode,
        response: { importCount, conflicts = [] },
      } = await this.postToDHIS2({ reportId, dataValueSet });

      if (httpStatusCode === 200) {
        const successLog = await this.logDHIS2Push({
          reportId,
          status: AUDIT_STATUSES.SUCCESS,
          message,
          importCount,
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
