import * as genericSurveyExportLineList from './generic-survey-export-line-list';

export async function getReportModule(reportId, models) {
  const dbDefinedReportModule = await models.ReportDefinitionVersion.findByPk(reportId);

  if (dbDefinedReportModule) {
    return dbDefinedReportModule;
  }

  if (reportId === 'generic-survey-export-line-list') {
    return genericSurveyExportLineList;
  }

  return null;
}

export { REPORT_DEFINITIONS, GENERIC_SURVEY_EXPORT_REPORT_ID } from './reportDefinitions';
export { REPORT_OBJECTS } from './reportObjects';
