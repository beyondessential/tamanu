import { ForbiddenError } from 'shared/errors';

export const assertReportEnabled = async (settings, reportId) => {
  const disabledReports = await settings.get('disabledReports');
  if (disabledReports.includes(reportId)) {
    throw new ForbiddenError(`Report "${reportId}" is disabled`);
  }

  return true;
};
