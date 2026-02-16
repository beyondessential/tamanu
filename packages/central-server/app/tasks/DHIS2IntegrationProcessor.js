import config from 'config';
import { pick, groupBy } from 'lodash';
import { fetch } from 'undici';
import { utils } from 'xlsx';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_STATUSES } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { fetchWithRetryBackoff } from '@tamanu/api-client/fetchWithRetryBackoff';

// DHIS2 dataValueSet object format:
// {
//   "dataSet": "dataSetID",
//   "completeDate": "date",
//   "period": "period",
//   "orgUnit": "orgUnitID",
//   "attributeOptionCombo": "aocID",
//   "dataValues": [
//     {
//       "dataElement": "dataElementID",
//       "categoryOptionCombo": "cocID",
//       "value": "1",
//       "comment": "comment1"
//     },
//     ...
//   ]
// }
const convertToDHIS2DataValueSets = (reportData, dataSet) => {
  // Convert 2D array report data to JSON format
  const reportJSON = utils.sheet_to_json(utils.aoa_to_sheet(reportData));

  // Group rows by their composite key (period + orgunit + attributeoptioncombo)
  const createGroupingKey = ({ period = '', orgunit = '', attributeoptioncombo = '' }) =>
    JSON.stringify([period, orgunit, attributeoptioncombo]);

  const groupedRows = Object.values(groupBy(reportJSON, createGroupingKey));

  // Transform each group of rows into a DHIS2 data value set object
  return groupedRows.map(rows => {
    // Extract common metadata from the first row (all rows in a group share these values)
    const { period, orgunit: orgUnit, attributeoptioncombo: attributeOptionCombo } = rows[0];

    // Map each row from the group to a data value object containing the actual data element values
    const dataValues = rows.map(row => ({
      dataElement: row.dataelement,
      categoryOptionCombo: row.categoryoptioncombo,
      value: row.value,
      comment: row.comment,
    }));

    // Construct the DHIS2 data value set object
    return {
      ...(dataSet && { dataSet, completeDate: getCurrentDateString() }),
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

  async postToDHIS2(dataValueSet) {
    const { idSchemes, host, backoff } = await this.context.settings.get('integrations.dhis2');
    const { username, password } = config.integrations.dhis2;
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
    const queryOptions = latestVersion.getQueryOptions();

    const reportData = await latestVersion.dataGenerator({ ...this.context, sequelize }, {}); // We don't support parameters in this task
    const dhis2DataValueSets = convertToDHIS2DataValueSets(reportData, queryOptions.dhis2DataSet);

    if (dhis2DataValueSets.length === 0) {
      log.warn(WARNING_LOGS.REPORT_DATA_EMPTY, { report: reportString });
      return;
    }

    for (const dataValueSet of dhis2DataValueSets) {
      try {
        const dhis2Response = await this.postToDHIS2(dataValueSet);
        // TODO: remove! This is to test a difference in behaviour between local and deploy
        console.log('dhis2Response', dhis2Response);
        const {
          message,
          httpStatusCode,
          response: { importCount, conflicts = [] },
        } = dhis2Response;

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

          log.warn(WARNING_LOGS.DATA_VALUE_SET_REJECTED, warningLog);
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
          dataValueSet: JSON.stringify(dataValueSet),
          error: error.message,
        });
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
      await this.processReport(reportId);
    }
  }
}
