import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Sequelize } from 'sequelize';
import { NotFoundError, InvalidOperationError } from 'shared/errors';
import { REPORT_VERSION_EXPORT_FORMATS } from 'shared/constants';
import { readJSON, sanitizeFilename, verifyQuery } from './utils';
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
  '/:reportId/versions',
  asyncHandler(async (req, res) => {
    const { store, params, body } = req;
    const {
      models: { ReportDefinitionVersion },
    } = store;
    const { reportId } = params;
    await verifyQuery(body.query, body.queryOptions.parameters, store);
    const version = await ReportDefinitionVersion.create({
      ...body,
      reportDefinitionId: reportId,
    });
    res.send(version);
  }),
);

reportsRouter.put(
  '/:reportId/versions/:versionId',
  asyncHandler(async (req, res) => {
    const { store, params, body } = req;
    const {
      models: { ReportDefinitionVersion },
    } = store;
    const { reportId, versionId } = params;
    const existingVersion = await ReportDefinitionVersion.findOne({
      where: { id: versionId, reportDefinitionId: reportId },
    });
    if (!existingVersion) {
      throw new NotFoundError(`No version found with id ${versionId}`);
    }
    const queryMutated =
      (body.query && body.query !== existingVersion.query) ||
      (body.queryOptions &&
        JSON.stringify(body.queryOptions) !== JSON.stringify(existingVersion.queryOptions));
    if (queryMutated) {
      throw new InvalidOperationError('Cannot change query of an existing version');
    }
    const version = await existingVersion.update(body);
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
    const { store, body } = req;
    const {
      models: { ReportDefinition, ReportDefinitionVersion },
      sequelize,
    } = store;

    const { name, file, userId, dryRun } = body;
    const versionData = await readJSON(file);

    if (versionData.versionNumber)
      throw new InvalidOperationError('Cannot import a report with a version number');

    await verifyQuery(versionData.query, versionData.queryOptions?.parameters, store);

    const feedback = {};
    try {
      await sequelize.transaction(
        {
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        },
        async () => {
          const [definition, createdDefinition] = await ReportDefinition.findOrCreate({
            where: {
              name,
            },
          });

          feedback.createdDefinition = createdDefinition;

          if (!createdDefinition) {
            const latestVersion = await ReportDefinitionVersion.findOne({
              where: { reportDefinitionId: definition.id },
              order: [['versionNumber', 'DESC']],
            });
            versionData.versionNumber = (latestVersion?.versionNumber || 0) + 1;
          }

          const versionNumber = versionData.versionNumber || 1;
          feedback.versionNumber = versionNumber;

          await ReportDefinitionVersion.upsert({
            ...versionData,
            userId,
            versionNumber,
            reportDefinitionId: definition.id,
          });

          if (dryRun) {
            throw new DryRun();
          }
        },
      );
    } catch (err) {
      if (!(err instanceof DryRun)) {
        throw err;
      }
    }
    res.send(feedback);
  }),
);
