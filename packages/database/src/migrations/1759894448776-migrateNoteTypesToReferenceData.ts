import { QueryInterface } from 'sequelize';
import { REFERENCE_TYPES } from '@tamanu/constants';

const NOTES_BATCH_SIZE = 10000;
const NOTES_NOTE_TYPE_ID_FKEY = 'notes_note_type_id_fkey';

/**
 * Hardcoded note types to create in reference_data.
 * These correspond to the NOTE_TYPES constant but are hardcoded here to ensure
 * migration stability regardless of constant changes.
 */
const NOTE_TYPE_REFERENCE_DATA = [
  {
    id: 'notetype-treatmentPlan',
    code: 'treatmentPlan',
    name: 'Treatment plan',
    system_required: true,
  },
  {
    id: 'notetype-discharge',
    code: 'discharge',
    name: 'Discharge planning',
    system_required: true,
  },
  {
    id: 'notetype-clinicalMobile',
    code: 'clinicalMobile',
    name: 'Clinical note (mobile)',
    system_required: true,
  },
  {
    id: 'notetype-handover',
    code: 'handover',
    name: 'Handover note',
    system_required: true,
  },
  {
    id: 'notetype-areaToBeImaged',
    code: 'areaToBeImaged',
    name: 'Area to be imaged',
    system_required: true,
  },
  {
    id: 'notetype-resultDescription',
    code: 'resultDescription',
    name: 'Result description',
    system_required: true,
  },
  {
    id: 'notetype-other',
    code: 'other',
    name: 'Other',
    system_required: true,
  },
  {
    id: 'notetype-system',
    code: 'system',
    name: 'System',
    system_required: true,
  },
  {
    id: 'notetype-admission',
    code: 'admission',
    name: 'Admission',
    system_required: false,
  },
  {
    id: 'notetype-medical',
    code: 'medical',
    name: 'Medical',
    system_required: false,
  },
  {
    id: 'notetype-surgical',
    code: 'surgical',
    name: 'Surgical',
    system_required: false,
  },
  {
    id: 'notetype-nursing',
    code: 'nursing',
    name: 'Nursing',
    system_required: false,
  },
  {
    id: 'notetype-dietary',
    code: 'dietary',
    name: 'Dietary',
    system_required: false,
  },
  {
    id: 'notetype-pharmacy',
    code: 'pharmacy',
    name: 'Pharmacy',
    system_required: false,
  },
  {
    id: 'notetype-physiotherapy',
    code: 'physiotherapy',
    name: 'Physiotherapy',
    system_required: false,
  },
  {
    id: 'notetype-social',
    code: 'social',
    name: 'Social welfare',
    system_required: false,
  },
];

const noteTypeIds = NOTE_TYPE_REFERENCE_DATA.map(({ id }) => `'${id}'`).join(', ');

async function updateNotesInBatches(
  query: QueryInterface,
  column: 'note_type' | 'note_type_id',
  filter: string,
  caseExpression: string,
  fallbackValue: string,
) {
  let updatedCount = 0;
  do {
    const [updatedRows] = await query.sequelize.query(`
      WITH batch AS (
        SELECT id
        FROM notes
        WHERE ${filter}
        ORDER BY id
        LIMIT ${NOTES_BATCH_SIZE}
      )
      UPDATE notes
      SET ${column} = CASE ${column}
          ${caseExpression}
          ELSE '${fallbackValue}'
      END
      FROM batch
      WHERE notes.id = batch.id
      RETURNING notes.id
    `);
    updatedCount = (updatedRows as unknown[]).length;
  } while (updatedCount > 0);
}

export async function up(query: QueryInterface) {
  for (const noteType of NOTE_TYPE_REFERENCE_DATA) {
    await query.sequelize.query(
      `
      INSERT INTO reference_data (id, type, code, name, system_required, visibility_status)
      VALUES (:id, :type, :code, :name, :system_required, 'current')
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        system_required = EXCLUDED.system_required
      `,
      {
        replacements: {
          id: noteType.id,
          type: REFERENCE_TYPES.NOTE_TYPE,
          code: noteType.code,
          name: noteType.name,
          system_required: noteType.system_required,
        },
      },
    );
  }

  const otherNoteType = NOTE_TYPE_REFERENCE_DATA.find(({ code }) => code === 'other')!;
  const upCaseExpression = NOTE_TYPE_REFERENCE_DATA.map(
    ({ id, code }) => `WHEN '${code}' THEN '${id}'`,
  ).join('\n        ');
  await updateNotesInBatches(
    query,
    'note_type',
    `note_type NOT IN (${noteTypeIds})`,
    upCaseExpression,
    otherNoteType.id,
  );
  await query.renameColumn('notes', 'note_type', 'note_type_id');
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

export async function down(query: QueryInterface) {
  await query.removeConstraint('notes', NOTES_NOTE_TYPE_ID_FKEY);
  const otherNoteType = NOTE_TYPE_REFERENCE_DATA.find(({ code }) => code === 'other')!;
  const downCaseExpression = NOTE_TYPE_REFERENCE_DATA.map(
    ({ id, code }) => `WHEN '${id}' THEN '${code}'`,
  ).join('\n        ');
  await updateNotesInBatches(
    query,
    'note_type_id',
    `note_type_id IN (${noteTypeIds})`,
    downCaseExpression,
    otherNoteType.code,
  );
  await query.renameColumn('notes', 'note_type_id', 'note_type');

  await query.sequelize.query(`DELETE FROM reference_data WHERE type = :noteType`, {
    replacements: { noteType: REFERENCE_TYPES.NOTE_TYPE },
  });
}
