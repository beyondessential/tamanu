import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { REPORT_VERSION_EXPORT_FORMATS } from 'shared/constants';
import { readJSON, sanitizeFilename, verifyQuery } from './utils';

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
    const versionWithoutMetadata = version.forResponse(true);
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

  reportsRouter.post(
    '/import',
    asyncHandler(async (req, res) => {
      const { store, body } = req;
      const {
        models: { ReportDefinition, ReportDefinitionVersion },
      } = store;

      const { name, file, userId } = body;
      const versionData = await readJSON(file);

      await verifyQuery(versionData.query, versionData.queryOptions?.parameters, store);

      const [definition, createdDefinition] = await ReportDefinition.findOrCreate({
        where: {
          name,
        },
      });

      const method = !createdDefinition && versionData.versionNumber ? 'update' : 'create';

      if (!createdDefinition) {
        if (versionData.versionNumber) {
          const existingVersion = await ReportDefinitionVersion.findOne({
            where: { reportDefinitionId: definition.id, versionNumber: versionData.versionNumber },
          });
          if (!existingVersion) {
            throw new NotFoundError(
              `Version ${versionData.versionNumber} does not exist for report ${name}`,
            );
          }
          versionData.id = existingVersion.id;
        } else {
          const latestVersion = await ReportDefinitionVersion.findOne({
            where: { reportDefinitionId: definition.id },
            order: [['versionNumber', 'DESC']],
          });
          versionData.versionNumber = (latestVersion?.versionNumber || 0) + 1;
        }
      }

      const versionNumber = versionData.versionNumber || 1;

      await ReportDefinitionVersion.upsert({
        ...versionData,
        userId,
        versionNumber,
        reportDefinitionId: definition.id,
      });

      res.send({
        method,
        versionNumber,
        createdDefinition,
      });
    }),
  ),
);
