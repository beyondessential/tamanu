import { DataTypes } from 'sequelize';

export async function up(query) {
  // await query.addColumn('user_preferences', 'facility_id', {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   references: {
  //     model: 'facilities',
  //     key: 'id',
  //   },
  // });

  await query.sequelize.query(`
    ALTER TABLE user_preferences
    ADD COLUMN facility_id VARCHAR(255) NULL,
    ADD CONSTRAINT fk_facility_id FOREIGN KEY (facility_id) REFERENCES facilities(id);
  `);

  await query.removeConstraint('user_preferences', 'user_preferences_user_id_uk');
  await query.removeConstraint('user_preferences', 'user_preferences_pkey');

  await query.removeColumn('user_preferences', 'id');
  await query.addColumn('user_preferences', 'id', {
    type: `TEXT GENERATED ALWAYS AS (COALESCE("user_id", '') || ';' || COALESCE("facility_id", '')) STORED`,
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
