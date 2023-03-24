import asyncHandler from 'express-async-handler';
import sequelize, { QueryTypes } from 'sequelize';

export const getReports = asyncHandler(async (req, res) => {
  const { store } = req;
  const result = await store.sequelize.query(
    `SELECT rd.id, rd.name, rd.created_at, rdv.updated_at AS "lastUpdated", rdv.version_number AS "versionCount"
    FROM report_definitions rd
    LEFT JOIN (
        SELECT MAX(updated_at) AS date_updated, MAX(version_number) AS version_num, report_definition_id
        FROM report_definition_versions
        GROUP BY report_definition_id
    ) AS latest_version ON latest_version.report_definition_id = rd.id
    JOIN report_definition_versions rdv ON rdv.report_definition_id = rd.id
    AND rdv.updated_at = latest_version.date_updated
    AND rdv.version_number = latest_version.version_num
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
  res.send(result);
});

export const getReportVersions = asyncHandler(async (req, res) => {
  const { store, params } = req;
  const {
    models: { ReportDefinitionVersion },
  } = store;
  const { reportId } = params;
  const versions = await ReportDefinitionVersion.findAll({
    where: { reportDefinitionId: reportId },
    order: [['versionNumber', 'DESC']],
  });
  res.send(versions);
});
