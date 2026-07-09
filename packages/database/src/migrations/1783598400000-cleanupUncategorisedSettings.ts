import { QueryInterface } from 'sequelize';

// A bug in the settings admin UI (EditorView.jsx's prepareSchema) mutated the
// shared schema singleton instead of cloning it, which caused top-level leaf
// settings (e.g. vitalEditReasons) to be nested under a synthetic
// "uncategorised" key whenever settings were saved from the JSON editor tab.
// Setting.set('', ...) flattens whatever object it's given into key/value
// rows, so this landed in the database as rows like "uncategorised.vitalEditReasons".
//
// For any such row, the real (correctly keyed) row was always left alive
// alongside it, so the "uncategorised.*" row is always a stale duplicate
// holding a default value - safe to soft-delete. As a precaution, if no live
// counterpart exists for some reason, promote the row by stripping the
// "uncategorised." prefix instead of losing it.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE settings
    SET key = regexp_replace(key, '^uncategorised\\.', '')
    WHERE key LIKE 'uncategorised.%'
      AND deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM settings real_setting
        WHERE real_setting.key = regexp_replace(settings.key, '^uncategorised\\.', '')
          AND real_setting.scope = settings.scope
          AND real_setting.facility_id IS NOT DISTINCT FROM settings.facility_id
          AND real_setting.deleted_at IS NULL
      );
  `);

  await query.sequelize.query(`
    UPDATE settings
    SET deleted_at = now()
    WHERE key LIKE 'uncategorised.%'
      AND deleted_at IS NULL;
  `);
}

export async function down(_query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the original "uncategorised.*" rows (and which were renamed
  // vs soft-deleted) cannot be reconstructed - they only ever held stale
  // duplicate default values, never a setting's authoritative value.
}
