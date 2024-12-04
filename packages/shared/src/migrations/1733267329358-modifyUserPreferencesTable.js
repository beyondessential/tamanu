import { DataTypes, Sequelize } from 'sequelize';

const SELECTED_GRAPHED_VITALS_ON_FILTER_KEY = 'selectedGraphedVitalsOnFilter';
const ENCOUNTER_TAB_ORDERS_KEY = 'encounterTabOrders';
const MOMENTARY_KEY = 'momentaryKeyUsedForThisMigration';

const GRAPH_UUID_NAMESPACE = 'ec4774c7-4d06-597a-8fb9-df656b17b6a9';
const ENCOUNTER_UUID_NAMESPACE = '4a3a08af-63f1-563b-bd3a-e9ec4001daeb';

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

  await query.sequelize.query(`
    INSERT INTO user_preferences (id, user_id, key, value, encounter_tab_orders)
    SELECT
      uuid_generate_v5('${GRAPH_UUID_NAMESPACE}', user_id || '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}'),
      user_id,
      '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}',
      to_jsonb(selected_graphed_vitals_on_filter::text),
      NULL
    FROM user_preferences
    WHERE selected_graphed_vitals_on_filter IS NOT NULL;
  `);

  await query.sequelize.query(`
    INSERT INTO user_preferences (id, user_id, key, value, encounter_tab_orders)
    SELECT
      uuid_generate_v5('${ENCOUNTER_UUID_NAMESPACE}', user_id || '${ENCOUNTER_TAB_ORDERS_KEY}'),
      user_id,
      '${ENCOUNTER_TAB_ORDERS_KEY}',
      encounter_tab_orders,
      NULL
    FROM user_preferences
    WHERE encounter_tab_orders IS NOT NULL;
  `);

  await query.sequelize.query(`
    DELETE FROM user_preferences
    WHERE selected_graphed_vitals_on_filter IS NOT NULL OR encounter_tab_orders IS NOT NULL;
  `);

  await query.removeColumn('user_preferences', 'selected_graphed_vitals_on_filter');
  await query.removeColumn('user_preferences', 'encounter_tab_orders');
  await query.changeColumn('user_preferences', 'key', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.changeColumn('user_preferences', 'value', {
    type: DataTypes.JSONB,
    allowNull: false,
  });
}

export async function down(query) {
  await query.addColumn('user_preferences', 'selected_graphed_vitals_on_filter', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('user_preferences', 'encounter_tab_orders', {
    type: DataTypes.JSONB,
    defaultValue: {},
  });

  await query.sequelize.query(`
    WITH
      graph_preferences AS (SELECT user_id, replace(value::text, '"', '') as "graph_value" FROM user_preferences WHERE key = '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}'),
      encounter_preferences AS (SELECT user_id, value as "encounter_value" FROM user_preferences WHERE key = '${ENCOUNTER_TAB_ORDERS_KEY}'),
      merged_preferences AS (SELECT gp.user_id, graph_value, encounter_value FROM graph_preferences gp FULL OUTER JOIN encounter_preferences ep ON gp.user_id = ep.user_id)

    INSERT INTO user_preferences (user_id, selected_graphed_vitals_on_filter, encounter_tab_orders, key, value)
    SELECT user_id, graph_value, encounter_value, '${MOMENTARY_KEY}', to_jsonb(''::text)
    FROM merged_preferences
  `);

  // Down migration would result in data loss on user preference!
  await query.sequelize.query(`
    DELETE FROM user_preferences
    WHERE key != '${MOMENTARY_KEY}'
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
