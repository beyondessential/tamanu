import * as genericSurveyExportLineList from './generic-survey-export-line-list';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';

// Maps ReportDefinition IDs to their static module implementations.
// Static reports have a ReportDefinition/Version record in the DB for permissions,
// but their data generation is handled by code rather than a SQL query.
const STATIC_REPORT_MODULES = {
  [GENERIC_SURVEY_EXPORT_REPORT_ID]: genericSurveyExportLineList,
};

export async function getReportModule(reportId, models) {
  const reportVersion = await models.ReportDefinitionVersion.findByPk(reportId);

  if (!reportVersion) {
    return null;
  }

  const staticModule = STATIC_REPORT_MODULES[reportVersion.reportDefinitionId];
  if (staticModule) {
    reportVersion.dataGenerator = staticModule.dataGenerator;
  }
  return reportVersion;
}
