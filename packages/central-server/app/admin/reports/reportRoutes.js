import express from 'express';
import config from 'config';
import { promises as fs } from 'fs';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Sequelize } from 'sequelize';
import { getUploadedData } from '@tamanu/shared/utils/getUploadedData';
import { InvalidOperationError, NotFoundError } from '@tamanu/shared/errors';
import { capitalize } from 'lodash';
import {
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
  REPORT_VERSION_EXPORT_FORMATS,
} from '@tamanu/constants';
import { readJSON, sanitizeFilename, verifyQuery } from './utils';
import { createReportDefinitionVersion } from './createReportDefinitionVersion';
import { DryRun } from '../errors';

export const reportsRouter = express.Router();

reportsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { store } = req;
    req.checkPermission('read', 'ReportDefinition');
    req.checkPermission('read', 'ReportDefinitionVersion');

    const canEditSchema = req.ability.can('write', 'ReportDbSchema');
    const isReportingSchemaEnabled = config.db.reportSchemas.enabled;

    const result = await store.sequelize.query(
      `SELECT rd.id,
        rd.name,
        rd.created_at AS "createdAt",
        rd.db_schema AS "dbSchema",
        max(rdv.updated_at) AS "lastUpdated",
        max(rdv.version_number) AS "versionCount"
    FROM report_definitions rd
        LEFT JOIN report_definition_versions rdv ON rd.id = rdv.report_definition_id
    ${
      isReportingSchemaEnabled && !canEditSchema
        ? `WHERE rd.db_schema = '${REPORT_DB_SCHEMAS.REPORTING}'`
        : ''
    }
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
    req.checkPermission('read', 'ReportDefinition');
    req.checkPermission('read', 'ReportDefinitionVersion');

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
    req.checkPermission('create', 'ReportDefinition');
    req.checkPermission('create', 'ReportDefinitionVersion');

    const { store, body, user, reportSchemaStores } = req;
    const isReportingSchemaEnabled = config.db.reportSchemas.enabled;
    const defaultReportingSchema = isReportingSchemaEnabled
      ? REPORT_DB_SCHEMAS.REPORTING
      : REPORT_DB_SCHEMAS.RAW;

    const transformedBody = !body.dbSchema ? { ...body, dbSchema: defaultReportingSchema } : body;

    const version = await createReportDefinitionVersion(
      { store, reportSchemaStores },
      null,
      transformedBody,
      user.id,
    );
    res.send(version);
  }),
);

reportsRouter.post(
  '/:reportId/versions',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReportDefinition');
    req.checkPermission('create', 'ReportDefinitionVersion');

    const { store, params, body, user, reportSchemaStores } = req;
    const { reportId } = params;
    const version = await createReportDefinitionVersion(
      { store, reportSchemaStores },
      reportId,
      body,
      user.id,
    );
    res.send(version);
  }),
);

reportsRouter.get(
  '/:reportId/versions/:versionId/export/:format',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'ReportDefinition');
    req.checkPermission('read', 'ReportDefinitionVersion');

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
    const versionWithoutMetadata = {
      ...version.forResponse(true),
      dbSchema: reportDefinition.dbSchema,
    };
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
      data,
    });
  }),
);

reportsRouter.post(
  '/import',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReportDefinition');
    req.checkPermission('create', 'ReportDefinitionVersion');

    const { store, user, reportSchemaStores } = req;
    const {
      models: { ReportDefinition, ReportDefinitionVersion },
      sequelize,
    } = store;
    const { reportSchemas } = config.db;

    const canEditSchema = req.ability.can('write', 'ReportDbSchema');

    const { name, file, dryRun, deleteFileAfterImport = true } = await getUploadedData(req);

    const versionData = await readJSON(file);

    if (versionData.versionNumber)
      throw new InvalidOperationError('Cannot import a report with a version number');

    if (reportSchemas.enabled && !canEditSchema && versionData.dbSchema === REPORT_DB_SCHEMAS.RAW) {
      throw new InvalidOperationError(
        'You do not have permission to import reports using the raw schema',
      );
    }

    const existingDefinition = await ReportDefinition.findOne({ where: { name } });
    if (existingDefinition && existingDefinition.dbSchema !== versionData.dbSchema) {
      throw new InvalidOperationError('Cannot change a reporting schema for existing report');
    }

    await verifyQuery(
      versionData.query,
      versionData.queryOptions,
      { store, reportSchemaStores },
      versionData.dbSchema,
    );

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
              dbSchema: reportSchemas.enabled ? versionData.dbSchema : REPORT_DB_SCHEMAS.RAW,
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

reportsRouter.get(
  '/:reportId/versions/:versionId',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'ReportDefinition');
    req.checkPermission('read', 'ReportDefinitionVersion');

    const {
      store,
      params,
      models: { ReportDefinitionVersion },
    } = req;
    const { reportId, versionId } = params;
    const version = await ReportDefinitionVersion.findOne({
      where: { id: versionId, reportDefinitionId: reportId },
      include: [
        {
          model: store.models.User,
          as: 'createdBy',
          attributes: ['displayName'],
        },
        {
          model: store.models.ReportDefinition,
          as: 'reportDefinition',
          attributes: ['name', 'id', 'dbSchema'],
        },
      ],
    });
    res.send(version);
  }),
);

reportsRouter.get(
  '/dbSchemaOptions',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    if (!config.db.reportSchemas.enabled) return res.send([]);
    const DB_SCHEMA_OPTIONS = Object.values(REPORT_DB_SCHEMAS).map(value => ({
      label: capitalize(value),
      value,
    }));
    return res.send(DB_SCHEMA_OPTIONS);
  }),
);
