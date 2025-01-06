import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class standardiseCaseAndPluralityOfAllTables1734080053767 implements MigrationInterface {
  tableNameMap = [
    {
      originalName: 'administered_vaccine',
      newName: 'administered_vaccines',
    },
    {
      originalName: 'attachment',
      newName: 'attachments',
    },
    {
      originalName: 'department',
      newName: 'departments',
    },
    {
      originalName: 'diagnosis',
      newName: 'encounter_diagnoses',
    },
    {
      originalName: 'encounter_history',
      newName: 'encounter_history',
    },
    {
      originalName: 'medication',
      newName: 'encounter_medications',
    },
    {
      originalName: 'encounter',
      newName: 'encounters',
    },
    {
      originalName: 'facility',
      newName: 'facilities',
    },
    {
      originalName: 'labRequest',
      newName: 'lab_requests',
    },
    {
      originalName: 'lab_test_panel_lab_test_type',
      newName: 'lab_test_panel_lab_test_types',
    },
    {
      originalName: 'lab_test_panel_request',
      newName: 'lab_test_panel_requests',
    },
    {
      originalName: 'lab_test_panel',
      newName: 'lab_test_panels',
    },
    {
      originalName: 'labTestType',
      newName: 'lab_test_types',
    },
    {
      originalName: 'labTest',
      newName: 'lab_tests',
    },
    {
      originalName: 'local_system_fact',
      newName: 'local_system_facts',
    },
    {
      originalName: 'locationGroup',
      newName: 'location_groups',
    },
    {
      originalName: 'location',
      newName: 'locations',
    },
    {
      originalName: 'noteItem',
      newName: 'note_items',
    },
    {
      originalName: 'notePage',
      newName: 'note_pages',
    },
    {
      originalName: 'note',
      newName: 'notes',
    },
    {
      originalName: 'patient_additional_data',
      newName: 'patient_additional_data',
    },
    {
      originalName: 'patient_contact',
      newName: 'patient_contacts',
    },
    {
      originalName: 'patient_facility',
      newName: 'patient_facilities',
    },
    {
      originalName: 'patient_field_definition_category',
      newName: 'patient_field_definition_categories',
    },
    {
      originalName: 'patient_field_definition',
      newName: 'patient_field_definitions',
    },
    {
      originalName: 'patient_field_value',
      newName: 'patient_field_values',
    },
    {
      originalName: 'patient_issue',
      newName: 'patient_issues',
    },
    {
      originalName: 'patient_program_registration_condition',
      newName: 'patient_program_registration_conditions',
    },
    {
      originalName: 'patient_program_registration',
      newName: 'patient_program_registrations',
    },
    {
      originalName: 'patient_secondary_id',
      newName: 'patient_secondary_ids',
    },
    {
      originalName: 'patient',
      newName: 'patients',
    },
    {
      originalName: 'program_data_element',
      newName: 'program_data_elements',
    },
    {
      originalName: 'program_registry',
      newName: 'program_registries',
    },
    {
      originalName: 'program_registry_clinical_status',
      newName: 'program_registry_clinical_statuses',
    },
    {
      originalName: 'program_registry_condition',
      newName: 'program_registry_conditions',
    },
    {
      originalName: 'program',
      newName: 'programs',
    },
    {
      originalName: 'reference_data',
      newName: 'reference_data',
    },
    {
      originalName: 'reference_data_relation',
      newName: 'reference_data_relations',
    },
    {
      originalName: 'referral',
      newName: 'referrals',
    },
    {
      originalName: 'scheduled_vaccine',
      newName: 'scheduled_vaccines',
    },
    {
      originalName: 'setting',
      newName: 'settings',
    },
    {
      originalName: 'survey_response_answer',
      newName: 'survey_response_answers',
    },
    {
      originalName: 'survey_response',
      newName: 'survey_responses',
    },
    {
      originalName: 'survey_screen_component',
      newName: 'survey_screen_components',
    },
    {
      originalName: 'survey',
      newName: 'surveys',
    },
    {
      originalName: 'translated_string',
      newName: 'translated_strings',
    },
    {
      originalName: 'user_facility',
      newName: 'user_facilities',
    },
    {
      originalName: 'user',
      newName: 'users',
    },
    {
      originalName: 'vital_log',
      newName: 'vital_logs',
    },
    {
      originalName: 'vitals',
      newName: 'vitals',
    },
  ];

  async getOrderedTableNames(queryRunner: QueryRunner): Promise<string[]> {
    const tableNamesResult = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`,
    );

    const tableNames = tableNamesResult.map((row: { name: string }) => row.name);

    const dependencies: Record<string, string[]> = {};

    for (const tableName of tableNames) {
      const foreignKeys = await queryRunner.query(`PRAGMA foreign_key_list(${tableName});`);
      dependencies[tableName] = foreignKeys.map((fk: any) => fk.table); // `fk.table` is the referenced table name
    }

    const sortedTables: string[] = [];
    const visited: Set<string> = new Set();

    const visit = (table: string) => {
      if (!visited.has(table)) {
        visited.add(table);
        for (const dependency of dependencies[table] || []) {
          visit(dependency);
        }
        sortedTables.push(table);
      }
    };

    for (const tableName of tableNames) {
      visit(tableName);
    }

    return sortedTables;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const allTables = await this.getOrderedTableNames(queryRunner);
    const tableNameMap = this.tableNameMap;

    // clone structure
    for (const tableName of allTables) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      const newTable = new Table({
        name: newTableName,
        columns: originalTable.columns.map(column => ({ ...column })),
        indices: originalTable.indices.map(index => ({ ...index, name: undefined })),
        foreignKeys: originalTable.foreignKeys.map(fk => {
          let referencedTableName = tableNameMap.find(
            t => t.originalName === fk.referencedTableName,
          )?.newName;
          // hack for lab_test_panel_lab_test_type
          if (
            tableName === 'lab_test_panel_lab_test_type' &&
            fk.referencedTableName === 'lab_test_type'
          ) {
            referencedTableName = 'lab_test_types';
          }
          return {
            ...fk,
            referencedTableName,
            name: undefined,
          };
        }),
      });

      await queryRunner.createTable(newTable);
    }

    // clone data
    for (const tableName of allTables) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      await queryRunner.query(`INSERT INTO ${newTableName} SELECT * FROM ${table.originalName};`);
    }

    // remove old tables
    for (const tableName of allTables.reverse()) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      if (table.originalName === table.newName) {
        await queryRunner.dropTable(table.originalName);
        await queryRunner.renameTable(newTableName, newTableName.replace('_temp', ''));
      } else {
        await queryRunner.dropTable(table.originalName);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const allTables = await this.getOrderedTableNames(queryRunner);
    const tableNameMap = this.tableNameMap.map(t => ({
      originalName: t.newName,
      newName: t.originalName,
    }));

    // clone structure
    for (const tableName of allTables) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      const newTable = new Table({
        name: newTableName,
        columns: originalTable.columns.map(column => ({ ...column })),
        indices: originalTable.indices.map(index => ({ ...index, name: undefined })),
        foreignKeys: originalTable.foreignKeys.map(fk => {
          let referencedTableName = tableNameMap.find(
            t => t.originalName === fk.referencedTableName,
          )?.newName;
          // hack for lab_test_panel_lab_test_type
          if (
            tableName === 'lab_test_panel_lab_test_type' &&
            fk.referencedTableName === 'lab_test_types'
          ) {
            referencedTableName = 'labTestType';
          }
          return {
            ...fk,
            referencedTableName,
            name: undefined,
          };
        }),
      });

      await queryRunner.createTable(newTable);
    }

    // clone data
    for (const tableName of allTables) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      await queryRunner.query(`INSERT INTO ${newTableName} SELECT * FROM ${table.originalName};`);
    }

    // remove old tables
    for (const tableName of allTables.reverse()) {
      const table = tableNameMap.find(t => t.originalName === tableName);
      if (!table) continue;

      const originalTable = await queryRunner.getTable(table.originalName);
      if (table.originalName === table.newName && !originalTable.foreignKeys.length) continue;

      const newTableName =
        table.originalName === table.newName ? `${table.newName}_temp` : table.newName;

      if (table.originalName === table.newName) {
        await queryRunner.dropTable(table.originalName);
        await queryRunner.renameTable(newTableName, newTableName.replace('_temp', ''));
      } else {
        await queryRunner.dropTable(table.originalName);
      }
    }
  }
}
