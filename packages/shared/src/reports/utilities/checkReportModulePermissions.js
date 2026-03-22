import { ForbiddenError } from '@tamanu/errors';
import { canRunStaticReport } from './canRunStaticReport';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '../reportDefinitions';
import { canRunSurveyReport } from './canRunSurveyReport';

export async function checkReportModulePermissions(req, reportModule, reportId, parameters) {
  const { ReportDefinitionVersion } = req.models;
  if (reportModule instanceof ReportDefinitionVersion) {
    const definition = await reportModule.getReportDefinition();
    req.checkPermission('run', definition);
  } else {
    if (!canRunStaticReport(req.ability, reportId)) {
      throw new ForbiddenError('User does not have permission to run the report');
    }
  }

  // Special case to check if user can run survey report
  if (reportId === GENERIC_SURVEY_EXPORT_REPORT_ID) {
    if (!canRunSurveyReport(req.ability, parameters?.surveyId)) {
      throw new ForbiddenError('User does not have permission to run the report');
    }
  }

  req.flagPermissionChecked();
}
