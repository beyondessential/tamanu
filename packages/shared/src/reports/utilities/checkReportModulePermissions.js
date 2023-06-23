import { ForbiddenError } from '../../errors';
import { canRunStaticReport } from './canRunStaticReport';

export async function checkReportModulePermissions(req, reportModule, reportId) {
  const { ReportDefinitionVersion } = req.models;
  if (reportModule instanceof ReportDefinitionVersion) {
    const definition = await reportModule.getReportDefinition();
    req.checkPermission('run', definition);
  } else {
    if (!canRunStaticReport(req.ability, reportId)) {
      throw new ForbiddenError('User does not have permission to run the report');
    }
    req.flagPermissionChecked();
  }
}
