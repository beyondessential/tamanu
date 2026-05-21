import { QueryInterface } from 'sequelize';

const NOTES_NOTE_TYPE_ID_FKEY = 'notes_note_type_id_fkey';

async function columnExists(query: QueryInterface, columnName: string): Promise<boolean> {
  const [results] = await query.sequelize.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = :columnName
    ) AS exists
  `,
    { replacements: { columnName } },
  );
  return Boolean((results as { exists: boolean }[])[0]?.exists);
}

async function constraintExists(query: QueryInterface, constraintName: string): Promise<boolean> {
  const [results] = await query.sequelize.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND constraint_name = :constraintName
    ) AS exists
  `,
    { replacements: { constraintName } },
  );
  return Boolean((results as { exists: boolean }[])[0]?.exists);
}

export async function up(query: QueryInterface): Promise<void> {
  const hasNoteType = await columnExists(query, 'note_type');
  const hasNoteTypeId = await columnExists(query, 'note_type_id');

  if (hasNoteType && !hasNoteTypeId) {
    await query.renameColumn('notes', 'note_type', 'note_type_id');
  }

  if (await columnExists(query, 'note_type_id')) {
    if (!(await constraintExists(query, NOTES_NOTE_TYPE_ID_FKEY))) {
      await query.addConstraint('notes', {
        fields: ['note_type_id'],
        type: 'foreign key',
        name: NOTES_NOTE_TYPE_ID_FKEY,
        references: {
          table: 'reference_data',
          field: 'id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      });
    }
  }
}

export async function down(query: QueryInterface): Promise<void> {
  if (await constraintExists(query, NOTES_NOTE_TYPE_ID_FKEY)) {
    await query.removeConstraint('notes', NOTES_NOTE_TYPE_ID_FKEY);
  }

  const hasNoteType = await columnExists(query, 'note_type');
  const hasNoteTypeId = await columnExists(query, 'note_type_id');

  if (hasNoteTypeId && !hasNoteType) {
    await query.renameColumn('notes', 'note_type_id', 'note_type');
  }
}
