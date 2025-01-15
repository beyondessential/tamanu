import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'facility_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'facilities',
      key: 'id',
    },
  });

  await query.sequelize.query(`
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_pkey;
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_key_uk;
  `);

  await query.removeColumn('user_preferences', 'id');
  await query.addColumn('user_preferences', 'id', {
    type: `TEXT GENERATED ALWAYS AS ("user_id" || ';' || "key" || ';' || COALESCE("facility_id", '')) STORED`,
  });

  await query.sequelize.query(`
    ALTER TABLE user_preferences ADD PRIMARY KEY (id);
  `);

  await query.sequelize.query(`
    CREATE UNIQUE INDEX user_preferences_unique_with_facility_id
    ON user_preferences (
      key,
      user_id,
      COALESCE(facility_id, '')
    );
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX user_preferences_unique_with_facility_id;
  `);

  await query.removeColumn('user_preferences', 'id');
  await query.addColumn('user_preferences', 'id', {
    type: DataTypes.UUID,
    allowNull: true,
  });
  await query.sequelize.query(`
      UPDATE user_preferences
      SET id = uuid_generate_v5(
        uuid_generate_v5(uuid_nil(), 'user_preferences'),
        user_id
      );
    `);
  await query.changeColumn('user_preferences', 'id', {
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });

  await query.sequelize.query(`
      ALTER TABLE user_preferences ADD PRIMARY KEY (id);
    `);

  await query.removeColumn('user_preferences', 'facility_id');

  await query.addConstraint('user_preferences', {
    fields: ['user_id', 'key'],
    type: 'unique',
  });
}
