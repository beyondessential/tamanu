import { ForbiddenError } from '@tamanu/errors';
import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';
import { canRunSurveyReport } from './canRunSurveyReport';

export async function checkReportModulePermissions(req, reportModule, parameters) {
  const definition = await reportModule.getReportDefinition();
  req.checkPermission('run', definition);

  // The generic survey export also requires Survey:read for the specific survey being exported
  if (reportModule.reportDefinitionId === GENERIC_SURVEY_EXPORT_REPORT_ID) {
    if (!canRunSurveyReport(req.ability, parameters?.surveyId)) {
      throw new ForbiddenError('User does not have permission to run the report');
    }
  }

  req.flagPermissionChecked();
}
