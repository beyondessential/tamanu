import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES_TO_WIPE = [
  'reference_data',
  'diagnosis',
  'medication',
  'program',
  'survey',
  'program_data_element',
  'survey_response_answer',
  'patient_additional_data',
  'survey_response',
  'referral',
  'department',
  'facility',
  'location',
  'scheduled_vaccine',
  'administered_vaccine',
  'labTestType',
  'labTest',
  'labRequest',
  'user',
  'vitals',
  'encounter',
  'patient_issue',
  'patient_secondary_id',
  'patient',
  'survey_screen_component',
  'patient_facility',
];

const LAST_SUCCESSFUL_SYNC_PULL = 'lastSuccessfulSyncPull';

const getDependencyMap = async (queryRunner: QueryRunner): Promise<object> => {
  const dependencyMap = {};

  for (const tableName of TABLES_TO_WIPE) {
    if (!dependencyMap[tableName]) {
      dependencyMap[tableName] = [];
    }
    const dependencies = await queryRunner.query(`PRAGMA foreign_key_list(${tableName})`);
    dependencyMap[tableName] = dependencies.map(d => d.table);
  }

  return dependencyMap;
};

export const sortInDependencyOrder = async (queryRunner: QueryRunner): Promise<string[]> => {
  const dependencyMap = await getDependencyMap(queryRunner);
  const sorted = [];
  const stillToSort = [...TABLES_TO_WIPE];

  while (stillToSort.length > 0) {
    stillToSort.forEach(tableName => {
      const dependsOn = dependencyMap[tableName] || [];
      const dependenciesStillToSort = dependsOn.filter(d => !!stillToSort.includes[d]);

      if (dependenciesStillToSort.length === 0) {
        sorted.push(tableName);
        stillToSort.splice(stillToSort.indexOf(tableName), 1);
      }
    });
  }

  return sorted;
};

export class wipeAllDataAndResync1675907161000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const [patientCountRow] = await queryRunner.query(`
      SELECT COUNT(*) AS "count" FROM patient
    `);
    const patientCount = parseInt(patientCountRow.count, 10);

    if (!patientCount) {
      // No patients means that this is the first mobile install
      // -> no need to wipe data
      return;
    }

    // Wipe all data that are synced from central
    const sortedTables = await sortInDependencyOrder(queryRunner);
    for (const tableName of sortedTables) {
      queryRunner.query(`DELETE FROM ${tableName}`);
    }

    const [localSystemFactRow] = await queryRunner.query(`
      SELECT id FROM local_system_fact WHERE key = '${LAST_SUCCESSFUL_SYNC_PULL}'
    `);

    // Set sync pull cursor back to -1 so that it forces a resync
    if (localSystemFactRow?.id) {
      await queryRunner.query(`
        UPDATE local_system_fact
        SET value = -1
        WHERE key = '${LAST_SUCCESSFUL_SYNC_PULL}';
      `);
    } else {
      // If mobile has already been synced, it must have this cursor
      throw new Error(
        `Cannot find local_system_fact sync pull cursor ${LAST_SUCCESSFUL_SYNC_PULL}`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Unable to revert this migration
  }
}
