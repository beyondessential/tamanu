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
    primaryKey: true,
  });
  await query.sequelize.query(`
    UPDATE "user_preferences"
    SET "id" = uuid_generate_v4()
    WHERE "id" IS NULL;
  `);
  await query.changeColumn('user_preferences', 'id', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  });
}

export async function down(query) {
  await query.removeColumn('user_preferences', 'facility_id');
  await query.removeConstraint('user_preferences', 'user_preferences_pkey');

  await query.removeColumn('user_preferences', 'id');
  await query.sequelize.query(`
    ALTER TABLE "user_preferences"
    ADD COLUMN "id" TEXT GENERATED ALWAYS AS ("user_id") STORED;
  `);

  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'unique',
    name: 'user_preferences_user_id_uk',
  });
  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'primary_key',
    name: 'user_preferences_pkey',
  });
}
