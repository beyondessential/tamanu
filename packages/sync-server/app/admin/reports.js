import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

const stripMetadata = ({ id, versionNumber, query, queryOptions, createdAt, updatedAt, status, notes }) => ({
  id,
  versionNumber,
  query,
  queryOptions,
  createdAt,
  updatedAt,
  status,
  notes,
});

export const getReports = asyncHandler(async (req, res) => {
  const { store } = req;
  const result = await store.sequelize.query(
    `SELECT rd.id, rd.name, rd.created_at, max(rdv.updated_at) AS "lastUpdated", max(rdv.version_number) AS "versionCount"
    FROM report_definitions rd
    LEFT JOIN report_definition_versions rdv ON rd.id = rdv.report_definition_id
    GROUP BY rd.id
    ORDER BY rd.name
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
    attributes: [
      'id',
      'versionNumber',
      'query',
      'createdAt',
      'updatedAt',
      'status',
      'notes',
      'queryOptions',
    ],
    order: [['versionNumber', 'DESC']],
    include: [
      {
        model: store.models.User,
        as: 'createdBy',
        attributes: ['displayName'],
      },
    ],
  });
  res.send(versions);
});

export const updateReportVersion = asyncHandler(async (req, res) => {
  const { store, params, body } = req;
  const {
    models: { ReportDefinitionVersion },
  } = store;
  const { reportId, versionId } = params;
  const existingVersion = await ReportDefinitionVersion.findOne({
    where: { id: versionId, reportDefinitionId: reportId },
  });
  if (!existingVersion) {
    throw new Error(`No version found with id ${versionId}`);
  }
  const version = await existingVersion.update(body);
  res.send(stripMetadata(version));
});

export const createReportVersion = asyncHandler(async (req, res) => {
  const { store, params, body } = req;
  const {
    models: { ReportDefinitionVersion },
  } = store;
  const { reportId } = params;
  const version = await ReportDefinitionVersion.create({
    ...body,
    reportDefinitionId: reportId,
  });
  res.send(stripMetadata(version));
});
