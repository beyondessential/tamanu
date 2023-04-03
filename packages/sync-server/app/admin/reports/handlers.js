import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { readJSON, verifyQuery } from './utils';

export const getReports = asyncHandler(async (req, res) => {
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
  ORDER BY rd.name
      `,
    {
      type: QueryTypes.SELECT,
    },
  );
  res.send(result);
});

export const importVersion = asyncHandler(async (req, res) => {
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
});
