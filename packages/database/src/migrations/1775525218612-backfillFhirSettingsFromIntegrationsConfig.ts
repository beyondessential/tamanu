/**
 * Central server only: for each leaf path under global FHIR settings (per schema defaults),
 * if `config.integrations.fhir` defines a value at the same relative path and no global
 * settings row exists yet, INSERT it. Skips paths with no config value. Facility servers
 * do not run this migration.
 *
 * Note: `integrations.fhir.enabled` and `integrations.fhir.worker.enabled` are not in the
 * fhir settings schema and are therefore not migrated here (they remain config-only).
 */
import { QueryTypes, QueryInterface } from 'sequelize';
import config from 'config';
import { get, isPlainObject } from 'lodash';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { globalDefaults } from '@tamanu/settings';

/** Dot-paths of every leaf value under `fhir` in global settings defaults (matches schema). */
function collectFhirSettingLeafPaths(value: unknown, prefix = ''): string[] {
  if (!isPlainObject(value)) {
    return prefix ? [prefix] : [];
  }
  const obj = value as Record<string, unknown>;
  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const child = obj[key];
    const segment = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(child)) {
      paths.push(...collectFhirSettingLeafPaths(child, segment));
    } else {
      paths.push(segment);
    }
  }
  return paths;
}

export async function up(query: QueryInterface): Promise<void> {
  if (selectFacilityIds(config)) {
    return;
  }

  const fhirFromConfig = config.integrations?.fhir;
  if (!isPlainObject(fhirFromConfig)) {
    return;
  }

  const fhirDefaults = globalDefaults.fhir;
  const leafPaths = collectFhirSettingLeafPaths(fhirDefaults);

  for (const relativePath of leafPaths) {
    const pathParts = relativePath.split('.');
    const configValue = get(fhirFromConfig, pathParts);
    if (configValue === undefined) {
      continue;
    }

    const settingKey = `fhir.${relativePath}`;

    const countRows = await query.sequelize.query<{ count: string }>(
      'SELECT count(*)::int AS count FROM settings WHERE key = $key AND facility_id IS NULL AND deleted_at IS NULL',
      {
        bind: { key: settingKey },
        type: QueryTypes.SELECT,
      },
    );
    const count = countRows[0]?.count ?? '0';
    if (Number(count) > 0) {
      continue; // Skip if setting has already been set
    }

    await query.sequelize.query('INSERT INTO settings (key, value) VALUES ($key, $value)', {
      bind: {
        key: settingKey,
        value: JSON.stringify(configValue),
      },
    });
  }
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: cannot distinguish rows inserted here from admin or later edits
}
