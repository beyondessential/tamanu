import { QueryInterface } from 'sequelize';

const NOTES_TRIGGERS_TO_DISABLE = [
  'notify_notes_changed',
  'record_notes_changelog',
  'fhir_refresh',
  'fhir_refresh_notes',
  'set_notes_updated_at',
];

const NOTE_TYPE_REFERENCE_DATA = [
  { id: 'notetype-treatmentPlan', code: 'treatmentPlan' },
  { id: 'notetype-discharge', code: 'discharge' },
  { id: 'notetype-clinicalMobile', code: 'clinicalMobile' },
  { id: 'notetype-handover', code: 'handover' },
  { id: 'notetype-areaToBeImaged', code: 'areaToBeImaged' },
  { id: 'notetype-resultDescription', code: 'resultDescription' },
  { id: 'notetype-other', code: 'other' },
  { id: 'notetype-system', code: 'system' },
  { id: 'notetype-admission', code: 'admission' },
  { id: 'notetype-medical', code: 'medical' },
  { id: 'notetype-surgical', code: 'surgical' },
  { id: 'notetype-nursing', code: 'nursing' },
  { id: 'notetype-dietary', code: 'dietary' },
  { id: 'notetype-pharmacy', code: 'pharmacy' },
  { id: 'notetype-physiotherapy', code: 'physiotherapy' },
  { id: 'notetype-social', code: 'social' },
];

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

async function triggerExists(query: QueryInterface, triggerName: string): Promise<boolean> {
  const [results] = await query.sequelize.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table = 'notes'
      AND trigger_name = :triggerName
    ) AS exists
  `,
    { replacements: { triggerName } },
  );
  return Boolean((results as { exists: boolean }[])[0]?.exists);
}

async function setTriggersEnabled(
  query: QueryInterface,
  triggerNames: string[],
  enabled: boolean,
): Promise<void> {
  for (const triggerName of triggerNames) {
    if (await triggerExists(query, triggerName)) {
      await query.sequelize.query(
        `ALTER TABLE notes ${enabled ? 'ENABLE' : 'DISABLE'} TRIGGER ${triggerName}`,
      );
    }
  }
}

async function updateNotes(
  query: QueryInterface,
  caseExpression: string,
  fallbackValue: string,
  alreadyCorrectValues: string,
) {
  await query.sequelize.query(`
    UPDATE notes
    SET
      note_type = CASE note_type
          ${caseExpression}
          ELSE '${fallbackValue}'
      END,
      updated_at = current_timestamp
    WHERE note_type NOT IN (${alreadyCorrectValues})
  `);
}

export async function up(query: QueryInterface): Promise<void> {
  if (!(await columnExists(query, 'note_type')) || (await columnExists(query, 'note_type_id'))) {
    return;
  }

  const otherNoteType = NOTE_TYPE_REFERENCE_DATA.find(({ code }) => code === 'other')!;
  const upCaseExpression = NOTE_TYPE_REFERENCE_DATA.map(
    ({ id, code }) => `WHEN '${code}' THEN '${id}'`,
  ).join('\n        ');
  const newFormatIds = NOTE_TYPE_REFERENCE_DATA.map(({ id }) => `'${id}'`).join(', ');

  try {
    await setTriggersEnabled(query, NOTES_TRIGGERS_TO_DISABLE, false);
    await updateNotes(query, upCaseExpression, otherNoteType.id, newFormatIds);
    // Refresh planner stats on note_type after rewriting every value.
    await query.sequelize.query(`ANALYZE notes`);
  } finally {
    await setTriggersEnabled(query, NOTES_TRIGGERS_TO_DISABLE, true);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  if (!(await columnExists(query, 'note_type'))) {
    return;
  }

  const otherNoteType = NOTE_TYPE_REFERENCE_DATA.find(({ code }) => code === 'other')!;
  const downCaseExpression = NOTE_TYPE_REFERENCE_DATA.map(
    ({ id, code }) => `WHEN '${id}' THEN '${code}'`,
  ).join('\n        ');
  const oldFormatCodes = NOTE_TYPE_REFERENCE_DATA.map(({ code }) => `'${code}'`).join(', ');

  try {
    await setTriggersEnabled(query, NOTES_TRIGGERS_TO_DISABLE, false);
    await updateNotes(query, downCaseExpression, otherNoteType.code, oldFormatCodes);
    await query.sequelize.query(`ANALYZE notes`);
  } finally {
    await setTriggersEnabled(query, NOTES_TRIGGERS_TO_DISABLE, true);
  }
}
