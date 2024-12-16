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

  // TODO: this needs to be commented/skipped until down migration works proper
  await query.removeConstraint('user_preferences', 'user_preferences_user_id_key');
  await query.removeConstraint('user_preferences', 'user_preferences_pk');

  await query.removeColumn('user_preferences', 'id');

  await query.addColumn('user_preferences', 'id', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: DataTypes.UUIDV4,
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

export async function down(query) {
  await query.removeConstraint('user_preferences', 'user_preferences_id_key');
  await query.removeConstraint('user_preferences', 'user_preferences_id_pk');
  await query.removeConstraint('user_preferences', 'user_facility_unique_index');

  await query.removeColumn('user_preferences', 'facility_id');

  await query.removeColumn('user_preferences', 'id');
  await query.sequelize.query(`
    ALTER TABLE "user_preferences"
    ADD COLUMN "id" TEXT GENERATED ALWAYS AS ("user_id") STORED;
  `);

  // TODO: need to somehow maniupulate data so i can reinstate unique + primary key constrants on user_id
}
