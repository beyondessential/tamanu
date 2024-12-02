import { DataTypes, Sequelize } from 'sequelize';

const SELECTED_GRAPHED_VITALS_ON_FILTER_KEY = 'selectedGraphedVitalsOnFilter';

export async function up(query) {
  await query.addColumn('user_preferences', 'key', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('user_preferences', 'value', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE user_preferences
    SET key = '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}', value = (to_json(selected_graphed_vitals_on_filter::text)::jsonb)
    WHERE selected_graphed_vitals_on_filter IS NOT NULL;
  `);

  await query.removeColumn('user_preferences', 'selected_graphed_vitals_on_filter');

  await query.changeColumn('user_preferences', 'key', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.changeColumn('user_preferences', 'value', {
    type: DataTypes.JSONB,
    allowNull: false,
  });

  await query.sequelize.query(`
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_pkey;
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_uk;
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
  await query.addConstraint('user_preferences', {
    fields: ['user_id', 'key'],
    type: 'unique',
  });
}

export async function down(query) {
  await query.addColumn('user_preferences', 'selected_graphed_vitals_on_filter', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE user_preferences
    SET selected_graphed_vitals_on_filter = value
    WHERE key = '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}'
  `);

  // Down migration would result in data loss on user preference!
  await query.sequelize.query(`
    DELETE FROM user_preferences
    WHERE key != '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}'
  `);

  await query.sequelize.query(`
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_pkey;
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_key_uk;
  `);

  await query.removeColumn('user_preferences', 'key');
  await query.removeColumn('user_preferences', 'value');

  await query.removeColumn('user_preferences', 'id');
  await query.addColumn('user_preferences', 'id', {
    type: `TEXT GENERATED ALWAYS AS ("user_id") STORED`,
  });
  await query.sequelize.query(`
    ALTER TABLE user_preferences ADD PRIMARY KEY (user_id);
  `);
  await query.addConstraint('user_preferences', {
    fields: ['user_id'],
    type: 'unique',
  });
}
