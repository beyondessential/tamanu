import { QueryInterface } from 'sequelize';

const NOTES_BATCH_SIZE = 10000;

const NOTES_DERIVED_SIDE_EFFECT_TRIGGERS = [
  'notify_notes_changed',
  'record_notes_changelog',
  'fhir_refresh',
  'fhir_refresh_notes',
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

const noteTypeIds = NOTE_TYPE_REFERENCE_DATA.map(({ id }) => `'${id}'`).join(', ');
const noteTypeCodes = NOTE_TYPE_REFERENCE_DATA.map(({ code }) => `'${code}'`).join(', ');

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

async function setKnownDerivedSideEffectTriggersEnabled(
  query: QueryInterface,
  enabled: boolean,
): Promise<void> {
  for (const triggerName of NOTES_DERIVED_SIDE_EFFECT_TRIGGERS) {
    if (await triggerExists(query, triggerName)) {
      await query.sequelize.query(
        `ALTER TABLE notes ${enabled ? 'ENABLE' : 'DISABLE'} TRIGGER ${triggerName}`,
      );
    }
  }
}

async function updateNotesInBatches(
  query: QueryInterface,
  filter: string,
  caseExpression: string,
  fallbackValue: string,
) {
  let lastId: string | null = null;
  do {
    const queryResults = await query.sequelize.query(
      `
      WITH batch AS (
        SELECT id
        FROM notes
        WHERE ${lastId ? 'id > :lastId AND' : ''} ${filter}
        ORDER BY id
        LIMIT ${NOTES_BATCH_SIZE}
      ),
      updated AS (
        UPDATE notes
        SET note_type = CASE note_type
            ${caseExpression}
            ELSE '${fallbackValue}'
        END
        FROM batch
        WHERE notes.id = batch.id
        RETURNING notes.id
      )
      SELECT id::text AS max_id
      FROM batch
      ORDER BY id DESC
      LIMIT 1
    `,
      { replacements: { lastId } },
    );
    const results = queryResults[0] as { max_id: string | null }[];
    lastId = results[0]?.max_id ?? null;
  } while (lastId);
}

export async function up(query: QueryInterface): Promise<void> {
  if (!(await columnExists(query, 'note_type')) || (await columnExists(query, 'note_type_id'))) {
    return;
  }

  const otherNoteType = NOTE_TYPE_REFERENCE_DATA.find(({ code }) => code === 'other')!;
  const upCaseExpression = NOTE_TYPE_REFERENCE_DATA.map(
    ({ id, code }) => `WHEN '${code}' THEN '${id}'`,
  ).join('\n        ');

  try {
    await setKnownDerivedSideEffectTriggersEnabled(query, false);
    await updateNotesInBatches(
      query,
      `note_type NOT IN (${noteTypeIds})`,
      upCaseExpression,
      otherNoteType.id,
    );
  } finally {
    await setKnownDerivedSideEffectTriggersEnabled(query, true);
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

  try {
    await setKnownDerivedSideEffectTriggersEnabled(query, false);
    await updateNotesInBatches(
      query,
      `note_type NOT IN (${noteTypeCodes})`,
      downCaseExpression,
      otherNoteType.code,
    );
  } finally {
    await setKnownDerivedSideEffectTriggersEnabled(query, true);
  }
}
