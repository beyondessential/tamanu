import { STRING, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
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
    FROM encounters
    WHERE administered_vaccines.encounter_id = encounters.id
    SET administered_vaccines.recorder_id = encounters.examiner_id,
        administered_vaccines.giver_id    = encounters.examiner_id
  `);
  await query.changeColumn('administered_vaccines', 'recorder_id', {
    type: STRING,
    allowNull: false,
  });

  await query.removeColumn('administered_vaccines', 'location');
  await query.addColumn('administered_vaccines', 'location_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'locations',
      key: 'id',
    },
  });
  await query.addColumn('administered_vaccines', 'deparment_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'deparments',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('administered_vaccines', 'department_id');
  await query.removeColumn('administered_vaccines', 'location_id');
  await query.removeColumn('administered_vaccines', 'recorder_id');
  await query.removeColumn('administered_vaccines', 'giver_id');

  await query.addColumn('administered_vaccines', 'location', {
    type: STRING,
    allowNull: true,
  });
}
