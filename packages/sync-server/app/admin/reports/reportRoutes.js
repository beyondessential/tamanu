import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

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
