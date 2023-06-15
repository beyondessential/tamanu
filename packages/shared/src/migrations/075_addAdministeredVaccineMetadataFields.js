import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'giver_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.addColumn('administered_vaccines', 'recorder_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
  await query.sequelize.query(`
    UPDATE administered_vaccines
    SET recorder_id = encounters.examiner_id,
        giver_id    = encounters.examiner_id
    FROM encounters
    WHERE administered_vaccines.encounter_id = encounters.id
  `);

  await query.removeColumn('administered_vaccines', 'location');
  await query.addColumn('administered_vaccines', 'location_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'locations',
      key: 'id',
    },
  });
  await query.addColumn('administered_vaccines', 'department_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'department_id');
  await query.removeColumn('administered_vaccines', 'location_id');
  await query.removeColumn('administered_vaccines', 'recorder_id');
  await query.removeColumn('administered_vaccines', 'giver_id');

  await query.addColumn('administered_vaccines', 'location', {
    type: STRING,
    allowNull: true,
  });
}
