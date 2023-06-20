import Sequelize from 'sequelize';

export async function up(query) {
  await query.createTable('note_items', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    note_page_id: {
      type: Sequelize.UUID,
      references: {
        model: 'note_pages',
        key: 'id',
      },
      allowNull: false,
    },
    revised_by_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    author_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: true,
    },
    on_behalf_of_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: true,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });
}

export async function down(query) {
  await query.dropTable('note_items');
}
