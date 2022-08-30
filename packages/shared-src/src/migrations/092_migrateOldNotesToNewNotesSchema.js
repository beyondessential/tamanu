import Sequelize from 'sequelize';
import { keyBy } from 'lodash';

export async function up(query) {
  const [oldNotes] = await query.sequelize.query('SELECT * FROM notes');
  for (const note of oldNotes) {
    await query.sequelize.query(
      `INSERT INTO note_pages(id, record_id, record_type, type, date, created_at, updated_at, deleted_at)
       VALUES(:id, :recordId, :recordType, :type, :date, :createdAt, :updatedAt, :deletedAt)
      `,
      {
        replacements: {
          id: note.id,
          recordId: note.record_id,
          recordType: note.record_type,
          type: note.note_type,
          date: note.date,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          deletedAt: note.deleted_at,
        },
      },
    );

    await query.sequelize.query(
      `
      INSERT INTO note_items(id, note_page_id, content, date, author_id, on_behalf_of_id, created_at, updated_at, deleted_at)
      VALUES(:id, :notePageId, :content, :date, :authorId, :onBehalfOfId, :createdAt, :updatedAt, :deletedAt)
      `,
      {
        replacements: {
          id: note.id,
          notePageId: note.id,
          content: note.content,
          date: note.date,
          authorId: note.author_id,
          onBehalfOfId: note.on_behalf_of_id,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          deletedAt: note.deleted_at,
        },
      },
    );
  }

  await query.dropTable('notes');

}

export async function down(query) {
  await query.createTable('note_items', {
    id: {
      type: Sequelize.STRING,
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
    note_type: {
      type: Sequelize.STRING,
      references: {
        model: 'note_pages',
        key: 'id',
      },
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    author_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
    },
    on_behalf_of_id: {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    record_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    record_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });

  const [notePages] = await query.sequelize.query('SELECT * FROM note_pages');
  const [noteItems] = await query.sequelize.query('SELECT * FROM note_items');

  const notePageById = keyBy(notePages, 'id');

  for (const noteItem of noteItems) {
    const notePage = notePageById[noteItem.note_page_id];
    await query.sequelize.query(
      `
      INSERT INTO note_items(id, note_type, content, author_id, on_behalf_of_id, date, record_id, record_type, created_at, updated_at, deleted_at)
      VALUES(:id, :noteType, :content, :authorId, :onBehalfOfId, :date, :recordId, :recordType, :createdAt, :updatedAt, :deletedAt)
      `,
      {
        replacements: {
          id: noteItem.id,
          noteType: notePage.note_type,
          content: noteItem.content,
          authorId: noteItem.author_id,
          onBehalfOfId: noteItem.on_behalf_of_id,
          date: noteItem.date,
          recordId: notePage.record_id,
          recordType: notePage.record_type,
          createdAt: notePage.created_at,
          updatedAt: notePage.updated_at,
          deletedAt: notePage.deleted_at,
        },
      },
    );
  }
  await query.dropTable('note_pages');
  await query.dropTable('note_items');
}
