import { REPORT_STATUSES, REPORT_DATE_RANGE_LABELS } from 'shared/constants';
import * as reportUtils from 'shared/reports';

const getBuiltinReports = ability => {
  const permittedReports = reportUtils.REPORT_DEFINITIONS.filter(r => ability.can('run', r));
  return permittedReports.map(r => ({ ...r, legacyReport: true }));
};

const getDbReports = async (ability, models) => {
  const { ReportDefinition } = models;
  const reportDefinitions = await ReportDefinition.findAll({
    include: [
      {
        model: models.ReportDefinitionVersion,
        as: 'versions',
        where: { status: REPORT_STATUSES.PUBLISHED },
      },
    ],
    order: [['versions', 'version_number', 'DESC']],
  });
  const permittedReportDefinitions = reportDefinitions.filter(rd => ability.can('run', rd));

  return permittedReportDefinitions.map(r => {
    // Get the latest report definition version by getting the first record from the ordered list
    const version = r.versions[0];

    return {
      id: version.id,
      name: r.name,
      dataSourceOptions: version.queryOptions.dataSources,
      filterDateRangeAsStrings: true,
      dateRangeLabel:
        version.queryOptions.dateRangeLabel ||
        REPORT_DATE_RANGE_LABELS[version.queryOptions.defaultDateRange],
      parameters: version.getParameters(),
      version: version.versionNumber,
    };
  });
};

const getDisabledReportIds = async (models, userId) => {
  const { UserLocalisationCache } = models;
  const localisation = await UserLocalisationCache.getLocalisation({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
  return localisation?.disabledReports || [];
};

export const getAvailableReports = async (ability, models, userId) => {
  const permittedReports = [
    ...getBuiltinReports(ability),
    ...(await getDbReports(ability, models)),
  ];
  const disabledReportIds = await getDisabledReportIds(models, userId);
  const enabledReports = permittedReports.filter(({ id }) => !disabledReportIds.includes(id));
  return enabledReports;
};
