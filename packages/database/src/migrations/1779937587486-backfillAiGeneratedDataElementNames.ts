import { type QueryInterface } from 'sequelize';

// Backfill ProgramDataElement.name for surveys saved by the AI form builder
// before TAM-2394 fixed the prompt. The build prompt used to tell the AI to
// default name to the question code when no name source was available, so the
// saved name ended up as e.g. "leptospirosisinvestigation022" — which is what
// the form response viewer's "Indicator" column then displayed.
//
// Targets exactly the bug's signature:
//   - name literally equals code (only the AI fallback produced this)
//   - code matches the AI's naming style (lowercase alphanumeric ending in
//     a 3-digit suffix, e.g. "ncdscreening001")
//   - default_text is a usable readable string to swap in
// so hand-imported rows with intentionally distinct names are untouched.

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE program_data_elements
    SET name = default_text
    WHERE name = code
      AND code ~ '^[a-z][a-z0-9]*[0-9]{3}$'
      AND default_text IS NOT NULL
      AND length(btrim(default_text)) > 0;
  `);

  // Rebuild the sync_lookup entries for any rows we touched so facilities pull
  // the updated names on next sync.
  await query.sequelize.query(
    `SELECT flag_lookup_model_to_rebuild('program_data_elements');`,
  );
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: cannot restore the original values — the previous name was
  // equal to code, which is exactly the bug this migration corrects. Reverting
  // would re-introduce code-as-name display, so the down is a deliberate no-op.
}
