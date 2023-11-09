import { ForbiddenError } from '@tamanu/shared/errors';

export const isReportEnabled = (localisation, reportId) => {
  const disabledReports = localisation?.disabledReports || [];
  return disabledReports.includes(reportId);
};

export const assertReportEnabled = (localisation, reportId) => {
  if (isReportEnabled(localisation, reportId)) {
    throw new ForbiddenError(`Report "${reportId}" is disabled`);
  }

  return true;
};
