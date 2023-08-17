import express from 'express';
import { promises as fs } from 'fs';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Sequelize } from 'sequelize';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { NotFoundError, InvalidOperationError } from '@tamanu/shared/errors';
import { REPORT_VERSION_EXPORT_FORMATS, REPORT_STATUSES } from '@tamanu/constants';
import { readJSON, sanitizeFilename, verifyQuery } from './utils';
import { createReportDefinitionVersion } from './createReportDefinitionVersion';
import { DryRun } from '../errors';

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
        [
          store.sequelize.literal(`version_number = (
            SELECT MAX(version_number)
            FROM report_definition_versions AS rdv
            WHERE rdv.report_definition_id = "ReportDefinitionVersion".report_definition_id
            AND rdv.status = '${REPORT_STATUSES.PUBLISHED}'
          )`),
          'active',
        ],
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

reportsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const { ReportDefinition } = store.models;
    const { name, ...definitionVersion } = body;
    const report = await ReportDefinition.create({ name });
    const version = await createReportDefinitionVersion(store, report.id, definitionVersion);
    res.send({ name: report.name, ...version });
  }),
);

reportsRouter.post(
  '/:reportId/versions',
  asyncHandler(async (req, res) => {
    const { store, params, body } = req;
    const { reportId } = params;
    const version = await createReportDefinitionVersion(store, reportId, body);
    res.send(version);
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
);

reportsRouter.post(
  '/import',
  asyncHandler(async (req, res) => {
    const { store, user } = req;
    const {
      models: { ReportDefinition, ReportDefinitionVersion },
      sequelize,
    } = store;

    const { name, file, dryRun, deleteFileAfterImport = true } = await getUploadedData(req);
    const versionData = await readJSON(file);

    if (versionData.versionNumber)
      throw new InvalidOperationError('Cannot import a report with a version number');

    await verifyQuery(versionData.query, versionData.queryOptions?.parameters, store);

    const feedback = {};
    try {
      await sequelize.transaction(
        {
          // Prevents race condition when determining the next version number
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        async () => {
          const [definition, createdDefinition] = await ReportDefinition.findOrCreate({
            where: {
              name,
            },
            include: [
              {
                model: ReportDefinitionVersion,
                as: 'versions',
                attributes: ['versionNumber'],
                order: [['versionNumber', 'DESC']],
                limit: 1,
              },
            ],
          });

          const versionNumber = createdDefinition
            ? 1
            : (definition.versions?.[0]?.versionNumber || 0) + 1;

          await ReportDefinitionVersion.create({
            ...versionData,
            userId: user.id,
            versionNumber,
            reportDefinitionId: definition.id,
          });

          feedback.createdDefinition = createdDefinition;
          feedback.versionNumber = versionNumber;

          if (dryRun) {
            throw new DryRun();
          }

          feedback.reportDefinitionId = definition.id;
        },
      );
    } catch (err) {
      if (!(err instanceof DryRun)) {
        throw err;
      }
    }
    if (deleteFileAfterImport) {
      // eslint-disable-next-line no-unused-vars
      await fs.unlink(file).catch(ignore => {});
    }
    res.send(feedback);
  }),
);
