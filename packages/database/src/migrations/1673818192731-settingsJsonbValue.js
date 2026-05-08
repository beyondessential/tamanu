import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('settings', 'key', {
    type: DataTypes.TEXT,
    allowNull: false,
  });

  await query.sequelize.query(`
    ALTER TABLE "settings"
      ALTER COLUMN "value"
        TYPE JSONB
          USING "value"::jsonb
  `);
}

export async function down(query) {
  await query.changeColumn('settings', 'key', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.changeColumn('settings', 'value', {
    type: DataTypes.STRING,
    allowNull: null,
  });
}
