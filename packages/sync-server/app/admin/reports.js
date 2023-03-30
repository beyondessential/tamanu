import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import config from 'config';
import fs from 'fs';
import { getQueryReplacementsFromParams } from 'shared/utils/getQueryReplacementsFromParams';

const stripMetadata = (version, includeRelationIds = false) => {
  const { id, versionNumber, query, queryOptions, createdAt, updatedAt, status, notes } = version;
  return {
    id,
    versionNumber,
    query,
    queryOptions,
    createdAt,
    updatedAt,
    status,
    notes,
    ...(includeRelationIds && {
      reportDefinitionId: version.reportDefinitionId,
      userId: version.userId,
    }),
  };
};

export const readJSON = async path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
};

const getFilename = (reportName, versionNumber, format) => {
  const sanitizedName = reportName
    .trim()
    .replace(/(\s|-)+/g, '-')
    .toLowerCase();
  return `${sanitizedName}-v${versionNumber}.${format}`;
};

export async function verifyQuery(query, paramDefinitions = [], store) {
  try {
    // use EXPLAIN instead of PREPARE because we don't want to stuff around deallocating the statement
    await store.sequelize.query(`EXPLAIN ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(paramDefinitions),
    });
  } catch (err) {
    throw new Error(`Invalid query: ${err.message}`);
  }
}

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

export const importReport = asyncHandler(async (req, res) => {
  const { store, body } = req;
  const {
    models: { ReportDefinition, ReportDefinitionVersion },
  } = store;
  const feedback = {};
  const { name, file } = body;

  const versionData = await readJSON(file);

  await verifyQuery(versionData.query, versionData.queryOptions?.parameters, store);

  const [definition, created] = await ReportDefinition.findOrCreate({
    where: {
      name,
    },
  });

  feedback.createdDefinition = created;

  const versions = created
    ? []
    : await ReportDefinitionVersion.findAll({
        where: { reportDefinitionId: definition.id },
      });

  if (Number.isInteger(versionData.versionNumber)) {
    const existingVersion = versions.find(v => v.versionNumber === versionData.versionNumber);
    if (!existingVersion) {
      throw new Error(`No version found with number ${versionData.versionNumber}`);
    }
    versionData.id = existingVersion.id;
  } else {
    const latestVersion = versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
    const versionNumber = (latestVersion?.versionNumber || 0) + 1;
    versionData.versionNumber = versionNumber;
  }

  feedback.versionNumber = versionData.versionNumber;

  let { userId } = versionData;

  if (!versionData.userId) {
    const {
      dbDefinedReports: { fallbackUser },
    } = config;
    const user = await store.models.User.findOne({
      where: { email: fallbackUser },
    });
    userId = user.id;
    feedback.usedFallbackUser = true;
  }

  await ReportDefinitionVersion.upsert({
    ...versionData,
    reportDefinitionId: definition.id,
    userId,
  });

  feedback.versionMethod = !versionData.id ? 'create' : 'update';

  res.send(feedback);
});

export const exportVersion = asyncHandler(async (req, res) => {
  const { store, params } = req;
  const {
    models: { ReportDefinition, ReportDefinitionVersion },
  } = store;
  const { reportId, versionId, format } = params;
  const reportDefinition = await ReportDefinition.findOne({
    where: { id: reportId },
  });
  if (!reportDefinition) {
    throw new Error(`No report found with id ${reportId}`);
  }
  const version = await ReportDefinitionVersion.findOne({
    where: { id: versionId, reportDefinitionId: reportId },
  });
  if (!version) {
    throw new Error(`No version found with id ${versionId}`);
  }
  const sanitizedVersion = stripMetadata(version, true);
  const filename = getFilename(reportDefinition.name, sanitizedVersion.versionNumber, format);

  let data;
  if (format === 'json') {
    data = JSON.stringify(sanitizedVersion, null, 2);
  } else if (format === 'sql') {
    data = sanitizedVersion.query;
  }
  res.send({
    filename,
    data: Buffer.from(data),
  });
});
