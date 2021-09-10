import { ForbiddenError } from 'shared/errors';

export const isReportEnabled = (localisation, reportType) => {
  const disabledReports = localisation?.disabledReports || [];
  return disabledReports.includes(reportType);
};

export const assertReportEnabled = (localisation, reportType) => {
  if (isReportEnabled(localisation, reportType)) {
    throw new ForbiddenError(`Report "${reportType}" is disabled`);
  }

  return true;
};
