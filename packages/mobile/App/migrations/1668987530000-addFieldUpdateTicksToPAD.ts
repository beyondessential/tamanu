import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { snakeCase } from 'lodash';
import { getTable } from './utils/queryRunner';

const METADATA_FIELDS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
];

const CURRENT_SYNC_TIME = 'currentSyncTick';

export class addFieldUpdateTicksToPAD1668987530000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patient_additional_data');
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'updatedAtByField',
        type: 'varchar',
        isNullable: true,
      }),
    );

    const [localSystemFactValue] = await queryRunner.query(`
      SELECT value FROM local_system_fact WHERE key = '${CURRENT_SYNC_TIME}'
    `);

    const syncTick =
      localSystemFactValue !== undefined ? parseInt(localSystemFactValue.value, 10) : 1;

    if (typeof syncTick !== 'number') {
      throw new Error('Sync tick is not numeric');
    }

    const columns = await queryRunner.query("PRAGMA table_info('patient_additional_data');");
    // A little hack to make sure 'id' is the first (since id will never be null)
    // column so that we get the commas in JSON string concatenation right
    const includedColumnNames = [
      'id',
      ...columns.map(c => c.name).filter(c => !METADATA_FIELDS.includes(c) && c !== 'id'),
    ];
    const updateColumnConcat = includedColumnNames
      .map(
        (c, index) =>
          `CASE WHEN ${c} IS NULL THEN '' ELSE '${index === 0 ? '' : ', '}"${snakeCase(
            c,
          )}": ${syncTick}' END\n`,
      )
      .join(' || ');

    await queryRunner.query(`
      UPDATE patient_additional_data
      SET updatedAtByField = (SELECT '{' || ${updateColumnConcat} || '}'
          FROM patient_additional_data AS sub_pad WHERE sub_pad.id = patient_additional_data.id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_additional_data', 'updatedAtByField');
  }
}
