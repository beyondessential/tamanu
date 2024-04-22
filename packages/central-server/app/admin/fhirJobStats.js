import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

export const fhirJobStats = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  const { store, query } = req;
  const { order: orderUnsafe, orderBy: orderByUnsafe } = query;
  const order = orderUnsafe === 'desc' ? 'desc' : 'asc';
  const orderBy =
    {
      topic: 'topic',
      status: 'status',
      count: 'COUNT(*)',
    }[orderByUnsafe] || 'topic';
  const stats = await store.sequelize.query(
    `SELECT topic, status, count(*)
     FROM fhir.jobs
     GROUP BY topic, status
     ORDER BY ${orderBy} ${order};`,
    {
      type: QueryTypes.SELECT,
    },
  );
  res.send({
    data: stats.map(({ topic, status, count }) => ({
      id: `${topic},${status}`,
      topic,
      status,
      count,
    })),
    count: stats.length,
  });
});
