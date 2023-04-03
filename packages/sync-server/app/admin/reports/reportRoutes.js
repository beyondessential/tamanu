import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { REPORT_VERSION_EXPORT_FORMATS } from 'shared/constants';
import { sanitizeFilename, stripMetadata } from './utils';

export const reportsRouter = express.Router();

reportsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    const result = await store.sequelize.query(
      `SELECT rd.id,
        rd.name,
        rd.created_at AS "createdAt",
        max(rdv.updated_at) AS "lastUpdated",
        max(rdv.version_number) AS "versionCount"
    FROM report_definitions rd
        LEFT JOIN report_definition_versions rdv ON rd.id = rdv.report_definition_id
    GROUP BY rd.id
    HAVING max(rdv.version_number) > 0
    ORDER BY rd.name
        `,
      {
        type: QueryTypes.SELECT,
      },
    );
    res.send(result);
  }),
);

reportsRouter.get(
  '/:reportId/versions',
  asyncHandler(async (req, res) => {
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
  }),
);

reportsRouter.get(
  '/:reportId/versions/:versionId/export/:format',
  asyncHandler(async (req, res) => {
    const { store, params } = req;
    const { ReportDefinition, ReportDefinitionVersion } = store.models;
    const { reportId, versionId, format } = params;
    const reportDefinition = await ReportDefinition.findOne({
      where: { id: reportId },
      include: [
        {
          model: ReportDefinitionVersion,
          as: 'versions',
          where: { id: versionId },
        },
      ],
    });
    if (!reportDefinition) {
      throw new NotFoundError(`No report found with id ${reportId}`);
    }
    const version = reportDefinition.versions[0];
    if (!version) {
      throw new NotFoundError(`No version found with id ${versionId}`);
    }
    const versionWithoutMetadata = stripMetadata(version, true);
    const filename = sanitizeFilename(
      reportDefinition.name,
      versionWithoutMetadata.versionNumber,
      format,
    );
    let data;
    if (format === REPORT_VERSION_EXPORT_FORMATS.JSON) {
      data = JSON.stringify(versionWithoutMetadata, null, 2);
    } else if (format === REPORT_VERSION_EXPORT_FORMATS.SQL) {
      data = versionWithoutMetadata.query;
    }
    res.send({
      filename,
      data: Buffer.from(data),
    });
  }),
);
