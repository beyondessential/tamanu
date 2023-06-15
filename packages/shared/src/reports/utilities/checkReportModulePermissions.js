import { ForbiddenError } from '../../errors';
import { canRunStaticReport } from './canRunStaticReport';

export async function checkReportModulePermissions(req, reportModule, reportId) {
  const { ReportDefinitionVersion } = req.models;
  if (reportModule instanceof ReportDefinitionVersion) {
    // for db-defined reports, check permission for specific report
    const definition = await reportModule.getReportDefinition();
    req.checkPermission('run', definition);
  } else {
    // for static reports, check EITHER defined permission OR explicit run permission
    if (!canRunStaticReport(req.ability, reportId, reportModule.permission)) {
      throw new ForbiddenError('User does not have permission to run the report');
    }
    req.flagPermissionChecked(); // flag because we're checking for either of two permissions
  }
}
