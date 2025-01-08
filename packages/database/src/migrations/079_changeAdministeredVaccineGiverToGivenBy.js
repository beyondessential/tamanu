import { STRING, TEXT } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'given_by', {
    type: TEXT,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE administered_vaccines
    SET given_by = users.display_name
    FROM users
    WHERE administered_vaccines.giver_id = users.id
  `);

  await query.removeColumn('administered_vaccines', 'giver_id');
}

export async function down(query) {
  await query.addColumn('administered_vaccines', 'giver_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.sequelize.query(`
    UPDATE administered_vaccines
    SET giver_id = users.id
    FROM users
    WHERE administered_vaccines.given_by = users.display_name
  `);

  await query.removeColumn('administered_vaccines', 'given_by');
}
