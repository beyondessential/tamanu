import * as genericSurveyExportLineList from './generic-survey-export-line-list';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';

export async function getReportModule(reportId, models) {
  const dbDefinedReportModule = await models.ReportDefinitionVersion.findByPk(reportId);

  if (dbDefinedReportModule) {
    return dbDefinedReportModule;
  }

  if (reportId === GENERIC_SURVEY_EXPORT_REPORT_ID) {
    return genericSurveyExportLineList;
  }

  return null;
}

export { REPORT_DEFINITIONS } from './reportDefinitions';
export { REPORT_OBJECTS } from './reportObjects';
