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

  await query.removeColumn('user_preferences', 'id');
  await query.addColumn('user_preferences', 'id', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: DataTypes.UUIDV4,
  });

  await query.sequelize.query(`
    UPDATE "user_preferences"
    SET "id" = uuid_generate_v5(
        '2f206659-ee5a-4de4-a3cf-91054d192ec9', 
        CONCAT(
          COALESCE("user_id", ''),
          COALESCE("facility_id", ''),
       ) 
    )
    WHERE "id" IS NULL;
  `);
  await query.changeColumn('user_preferences', 'id', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
  });

  await query.addIndex('user_preferences', {
    name: 'user_facility_unique_index',
    unique: true,
    fields: ['user_id', 'facility_id'],
  });

  await query.addConstraint('user_preferences', {
    type: 'primary key',
    fields: ['id'],
  });
}

export async function down() {
  // migration is irreversible as user_id can no longer be PK
  return null;
}
