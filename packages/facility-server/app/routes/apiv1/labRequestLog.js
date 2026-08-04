import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';

export const labRequestLog = express.Router();

// spec: LABSTAT
// Every write to a lab request leaves a changelog entry, so a status transition is an
// entry whose status differs from the one before it.
const getStatusTransitions = (db, labRequestId) =>
  db.query(
    `
      WITH entries AS (
        SELECT
          lc.created_at,
          lc.record_data->>'status' AS status,
          lc.updated_by_user_id,
          LAG(lc.record_data->>'status') OVER (ORDER BY lc.created_at, lc.id) AS previous_status
        FROM logs.changes lc
        WHERE lc.table_name = 'lab_requests'
          AND lc.record_id = :labRequestId
          AND lc.migration_context IS NULL
      )
      SELECT
        entries.created_at AS "createdAt",
        entries.status,
        entries.updated_by_user_id AS "updatedById",
        users.display_name AS "updatedByDisplayName"
      FROM entries
      LEFT JOIN users ON users.id = entries.updated_by_user_id
      WHERE entries.previous_status IS NULL OR entries.status <> entries.previous_status
      ORDER BY entries.created_at DESC
    `,
    { replacements: { labRequestId }, type: QueryTypes.SELECT },
  );

labRequestLog.get(
  '/labRequest/:id',
  asyncHandler(async (req, res) => {
    const { db, params } = req;
    req.checkPermission('list', 'LabRequestLog');

    const data = await getStatusTransitions(db, params.id);

    res.send({ count: data.length, data });
  }),
);

labRequestLog.get(
  '/labRequest/:id/latest-published',
  asyncHandler(async (req, res) => {
    const { db, params } = req;
    req.checkPermission('list', 'LabRequestLog');

    const transitions = await getStatusTransitions(db, params.id);
    const latestPublished = transitions.find(({ status }) =>
      [LAB_REQUEST_STATUSES.PUBLISHED, LAB_REQUEST_STATUSES.VERIFIED].includes(status),
    );

    res.send(
      latestPublished
        ? { ...latestPublished, updatedBy: { displayName: latestPublished.updatedByDisplayName } }
        : null,
    );
  }),
);
