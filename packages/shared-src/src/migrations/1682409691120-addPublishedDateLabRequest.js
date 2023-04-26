import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('lab_requests', 'published_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
  await query.sequelize.query(`
  UPDATE lab_requests
    SET published_date = to_char(lrl.created_at, 'YYYY-MM-DD HH24:MI:SS')
    FROM lab_request_logs lrl
    WHERE lrl.lab_request_id = lab_requests.id AND lrl.status = 'published';
  `);
}

export async function down(query) {
  await query.removeColumn('lab_requests', 'published_date');
}
