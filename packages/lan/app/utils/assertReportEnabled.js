import { ForbiddenError } from 'shared/errors';

export const isReportEnabled = (localisation, reportId) => {
  const disabledReports = localisation?.disabledReports || [];
  return disabledReports.includes(reportId);
};

export const assertReportEnabled = async (settings, reportId) => {
  const disabledReports = await settings.get('disabledReport');
  if (!disabledReports.includes(reportId)) {
    throw new ForbiddenError(`Report "${reportId}" is disabled`);
  }

  return true;
};
