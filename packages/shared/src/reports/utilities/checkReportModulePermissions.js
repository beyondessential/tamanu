import { ForbiddenError } from '@tamanu/errors';
import { canRunReport } from './canRunReport';

export async function checkReportModulePermissions(req, reportModule, parameters) {
  const definition = await reportModule.getReportDefinition();
  req.checkPermission('run', definition);

  if (!canRunReport(req.ability, definition, parameters)) {
    throw new ForbiddenError('User does not have permission to run the report');
  }

  req.flagPermissionChecked();
}
