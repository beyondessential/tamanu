import { ForbiddenError } from 'shared/errors';

export const assertIfReportEnabled = async (userLocalisationCacheModel, userId, reportType) => {
  const localisation = await userLocalisationCacheModel.getLocalisation({
    where: { userId: userId },
    order: [['createdAt', 'DESC']],
  });

  const disabledReports = localisation?.disabledReports || [];

  if (disabledReports.includes(reportType)) {
    throw new ForbiddenError(`Report "${reportType}" is disabled`);
  }

  return true;
};
