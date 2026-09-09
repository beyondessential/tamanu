import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Only pushed models (PUSH_TO_CENTRAL or BIDIRECTIONAL) are ever queried by updatedAtSyncTick (for
 * sync snapshots). Maintenance of these indexes is just overhead during every pull.
 */
const UNUSED_SYNC_TICK_INDEXES = [
  ['departments', 'IDX_cccd2af342fcd5a3ad4b05ecf4'],
  ['facilities', 'IDX_4194f54274787b5417b0ce5b3b'],
  ['lab_test_panel_lab_test_types', 'IDX_c451e8510cff3c8f155446e362'],
  ['lab_test_panels', 'IDX_2e01285d66c4bd4ee542cf74d8'],
  ['lab_test_types', 'IDX_1c65a1b520af374dec80ec1d0f'],
  ['local_system_facts', 'IDX_0f22e8665eefb7decd8e7fa726'],
  ['location_groups', 'IDX_c78ba061e331034c1ff115232a'],
  ['locations', 'IDX_36390d963ee9f0c4ff451a17cc'],
  ['note_items', 'IDX_643b99aaa2c5cab5a5e613610e'],
  ['note_pages', 'IDX_9cded7c3c1b8814d3b52a077e7'],
  ['program_data_elements', 'IDX_5a2a7475106ffe57cd79060ba3'],
  ['program_registries', 'IDX_8c4d39fd4b23845489b40f3f4e'],
  ['program_registry_condition_categories', 'IDX_00174e02c102a499b884ee7bfc'],
  ['program_registry_conditions', 'IDX_2f89d37740a8774760a5b7b4d3'],
  ['programs', 'IDX_518fcdb7e30da13f2e662b736e'],
  ['reference_data', 'IDX_864d94af6194d280b9d26e30ef'],
  ['reference_data_relations', 'IDX_561cd2bd25383d6470956dcb8f'],
  ['scheduled_vaccines', 'IDX_fc4bd7ebe87b1eb5d45b9a3cc6'],
  ['settings', 'IDX_304d76f990a8bcad7f3ba2c6f1'],
  ['survey_screen_components', 'IDX_81a43990ee008242137908e53d'],
  ['surveys', 'IDX_a53ef62409b4a5f205b3801638'],
  ['users', 'IDX_ec6ecec098213dfeff89b1b08a'],
] as const;

const OTHER_ZERO_BENEFIT_INDEXES = [
  // Duplicates unique constraint on users.email (sqlite_autoindex_users_2)
  ['users', 'IDX_97672ac88f789774dd47f7c8be', ['email']],
  // Left prefix of unique index on (stringId, language)
  ['translated_strings', 'IDX_043598e1e90dcff67779a634a4', ['stringId']],
  // Left prefix of unique index on (referenceDataId, type)
  ['reference_data_relations', 'IDX_b93ca99a7875af38764ef24ee7', ['referenceDataId']],
  // The ReferenceData.children relation is never loaded on mobile
  ['reference_data_relations', 'IDX_8e4c8748a3892d22fb13076fd9', ['referenceDataParentId']],
  // Hierarchy queries always constrain referenceDataId too, which the unique index serves better;
  // no mobile query filters reference_data_relations by type alone
  ['reference_data_relations', 'IDX_13c1d275e00c91cb26fc097dda', ['type']],
] as const;

const ALL_INDEXES: readonly (readonly [string, string, readonly string[]])[] = [
  ...UNUSED_SYNC_TICK_INDEXES.map(([table, name]) => [table, name, ['updatedAtSyncTick']] as const),
  ...OTHER_ZERO_BENEFIT_INDEXES,
];

export class removeZeroBenefitIndexes1787214563000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [, name] of ALL_INDEXES) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [tableName, name, columnNames] of [...ALL_INDEXES].reverse()) {
      const columns = columnNames.map(column => `"${column}"`).join(', ');
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${tableName}" (${columns})`,
      );
    }
  }
}
