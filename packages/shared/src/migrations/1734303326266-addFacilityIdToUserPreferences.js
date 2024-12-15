import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });

  await query.removeConstraint('user_preferences', 'user_preferences_user_id_uk');
  await query.removeConstraint('user_preferences', 'user_preferences_pkey');

  await query.addConstraint('user_preferences', {
    fields: ['id'],
    type: 'primary_key',
    name: 'user_preferences_pkey',
  });

  await query.sequelize.query(`
    ALTER TABLE "user_preferences"
    ALTER COLUMN "id" SET GENERATED ALWAYS AS (CONCAT("user_id", '-', "facility_id")) STORED;
  `);
}

export async function down(query) {
  await query.removeColumn('user_preferences', 'facility_id');
  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'unique',
    name: 'user_preferences_user_id_uk',
  });
  await query.removeConstraint('user_preferences', 'user_preferences_pkey');
  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'primary_key',
    name: 'user_preferences_pkey',
  });
  await query.sequelize.query(`
    ALTER TABLE "user_preferences"
    ALTER COLUMN "id" SET TEXT GENERATED ALWAYS AS ("user_id") STORED;
  `);
}
