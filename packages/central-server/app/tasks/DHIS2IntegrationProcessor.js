import config from 'config';
import { pick, groupBy } from 'lodash';
import { fetch } from 'undici';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { getCurrentDateStringInTimezone } from '@tamanu/utils/dateTime';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';
import {
  getConfigSecret,
  getSettingSecret,
  SecretNotConfiguredError,
} from '@tamanu/shared/utils/crypto';

// https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-239/data.html#webapi_sending_bulks_data_values
const convertToDHIS2DataValueSets = (reportData, dataSet) => {
  if (!Array.isArray(reportData) || reportData.length === 0) return [];
  const [headers, ...rows] = reportData;
  const reportJSON = rows.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])));

  // Group rows by their composite key (period + orgunit + attributeoptioncombo)
  const createGroupingKey = ({ period = '', orgunit = '', attributeoptioncombo = '' }) =>
    `${period}|${orgunit}|${attributeoptioncombo}`;

  const groupedRows = Object.values(groupBy(reportJSON, createGroupingKey));

  // Transform each group of rows into a DHIS2 data value set object
  return groupedRows.map(group => {
    const { period, orgunit: orgUnit, attributeoptioncombo: attributeOptionCombo } = group[0];

    const dataValues = group.map(row => ({
      dataElement: row.dataelement,
      categoryOptionCombo: row.categoryoptioncombo,
      value: row.value,
      comment: row.comment,
    }));

    // Construct the DHIS2 data value set object
    return {
      ...(dataSet && { dataSet, completeDate: getCurrentDateStringInTimezone(getPrimaryTimeZone(config)) }),
      period,
      orgUnit,
      attributeOptionCombo,
      dataValues,
    };
  });
};

export const INFO_LOGS = {
  SENDING_REPORTS: 'DHIS2IntegrationProcessor: Sending reports to DHIS2',
  PROCESSING_REPORT: 'DHIS2IntegrationProcessor: Processing report',
  SUCCESSFULLY_SENT_DATA_VALUE_SET:
    'DHIS2IntegrationProcessor: dataValueSet sent to DHIS2 successfully',
};

export const WARNING_LOGS = {
  INTEGRATION_NOT_CONFIGURED:
    'DHIS2IntegrationProcessor: DHIS2 integration not properly configured, skipping',
  REPORT_DOES_NOT_EXIST: "DHIS2IntegrationProcessor: Report doesn't exist, skipping",
  REPORT_HAS_NO_PUBLISHED_VERSION:
    'DHIS2IntegrationProcessor: Report has no published version, skipping',
  REPORT_DATA_EMPTY: 'DHIS2IntegrationProcessor: Report returned no data rows, skipping push',
  DATA_VALUE_SET_REJECTED: 'DHIS2IntegrationProcessor: dataValueSet rejected by DHIS2',
};

export const ERROR_LOGS = {
  ERROR_POSTING_DATA_VALUE_SET: 'DHIS2IntegrationProcessor: Error posting dataValueSet to DHIS2',
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

  /**
   * Gets DHIS2 credentials. Username is stored plaintext (so operators can
   * verify it at a glance). Password is sensitive and runs through a fallback
   * chain: settings secret (DB) → config secret (encrypted file) → plain config.
   */
  async getDHIS2Credentials() {
    const dhis2Settings = await this.context.settings.get('integrations.dhis2');
    // Falsy fallback is intentional: empty-string default in the schema means
    // "not configured", so we want to fall through to config in that case.
    const username =
      dhis2Settings?.username || config.integrations?.dhis2?.username || null;
    const password = await this.getDHIS2Password();
    return { username, password };
  }

  async getDHIS2Password() {
    const sources = [
      {
        label: 'settings secret',
        fetch: () => getSettingSecret(this.context.settings, 'integrations.dhis2.password'),
      },
      {
        label: 'config secret',
        fetch: () => getConfigSecret('integrations.dhis2.password'),
      },
    ];

    for (const { label, fetch } of sources) {
      try {
        return await fetch();
      } catch (error) {
        if (error instanceof SecretNotConfiguredError) continue;
        // Decryption / unexpected errors must not silently fall through to a
        // less-secure source — surface them to operators.
        log.warn('DHIS2IntegrationProcessor: failed to read password', {
          source: label,
          error: error.message,
        });
        return null;
      }
    }

    return config.integrations?.dhis2?.password ?? null;
  }

  async postToDHIS2(dataValueSet) {
    const { idSchemes, host, backoff } = await this.context.settings.get('integrations.dhis2');
    const { username, password } = await this.getDHIS2Credentials();
    if (!username || !password) {
      // Defensive: run() guards on missing credentials, but postToDHIS2 may be
      // called directly. Failing fast prevents sending "null:null" as a Basic
      // Auth header to DHIS2.
      throw new Error('DHIS2 credentials are not configured');
    }
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

    const params = new URLSearchParams({ ...idSchemes, importStrategy: 'CREATE_AND_UPDATE' });

    const response = await fetchWithRetryBackoff(
      `${host}/api/dataValueSets?${params.toString()}`,
      {
        fetch,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(dataValueSet),
      },
      { ...backoff, log },
    );

    return await response.json();
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
    const advancedConfig = latestVersion.getAdvancedConfig();

    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const dhis2DataValueSets = convertToDHIS2DataValueSets(reportData, advancedConfig.dhis2DataSet);

    if (dhis2DataValueSets.length === 0) {
      log.warn(WARNING_LOGS.REPORT_DATA_EMPTY, { report: reportString });
      return;
    }

    for (const dataValueSet of dhis2DataValueSets) {
      try {
        const dhis2Response = await this.postToDHIS2(dataValueSet);
        const { message, httpStatusCode, response } = dhis2Response;
        const { importCount, conflicts = [] } = response ?? {};

        if (httpStatusCode === 200) {
          const successLog = await this.logDHIS2Push({
            reportId,
            status: AUDIT_STATUSES.SUCCESS,
            message,
            importCount,
          });

          log.info(INFO_LOGS.SUCCESSFULLY_SENT_DATA_VALUE_SET, successLog);
        } else {
          const warningLog = await this.logDHIS2Push({
            reportId,
            status: AUDIT_STATUSES.WARNING,
            message,
            importCount,
            conflicts: conflicts.map(conflict => conflict.value),
          });

          log.warn(WARNING_LOGS.DATA_VALUE_SET_REJECTED, { ...warningLog, httpStatusCode });
          conflicts.forEach(conflict => log.warn(conflict.value));
        }
      } catch (error) {
        await this.logDHIS2Push({
          reportId,
          status: AUDIT_STATUSES.FAILURE,
          message: error.message,
        });
        log.error(ERROR_LOGS.ERROR_POSTING_DATA_VALUE_SET, {
          reportId,
          period: dataValueSet.period,
          orgUnit: dataValueSet.orgUnit,
          dataValueCount: dataValueSet.dataValues?.length,
          error: error.message,
        });
      }
    }
  }

  async run() {
    const { reportIds, host } = await this.context.settings.get('integrations.dhis2');
    const { enabled } = config.integrations?.dhis2 || {};
    const { username, password } = await this.getDHIS2Credentials();

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
        log.error(ERROR_LOGS.ERROR_PROCESSING_REPORT, { reportId, error: error.message });
      }
    }
  }
}
