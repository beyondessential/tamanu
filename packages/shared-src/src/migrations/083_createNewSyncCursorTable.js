import { BIGINT, STRING, DATE, NOW, UUIDV4 } from 'sequelize';

export async function up(query) {
  await query.createTable('sync_cursors', {
    id: {
      type: STRING,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    updated_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DATE,
      allowNull: true,
    },
    direction: {
      type: STRING,
      allowNull: false,
    },
    last_beat: {
      type: BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
  });
}

export async function down(query) {
  await query.dropTable('sync_cursors');
}
