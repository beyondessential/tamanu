import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'attachments';

// spec: MOB, ATCH
// Attachment records carry the hash of their content and the patient linkage of
// the record they were created for, mirroring the server migrations of the same
// era (addAttachmentHash, addAttachmentScopeColumns). The `data` blob column is
// dropped: the device holds no binary column for attachment content — bytes live
// in the device's blob store and are reached through the record's hash. The
// column was only ever populated in memory on load, never written, so no stored
// content is lost. `filePath` stays as the local-only legacy pointer that the
// startup adoption pass consumes.
export class reshapeAttachmentsForBlobStore1785850000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'hash',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'patientId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'encounterId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
        columnNames: ['patientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
      }),
    );
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
        columnNames: ['encounterId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'encounters',
      }),
    );
    await queryRunner.dropColumn(table, 'data');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'data',
        type: 'blob',
        isNullable: true,
      }),
    );
    const foreignKeys = table.foreignKeys.filter(fk =>
      ['patientId', 'encounterId'].includes(fk.columnNames[0]),
    );
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey(table, foreignKey);
    }
    await queryRunner.dropColumn(table, 'encounterId');
    await queryRunner.dropColumn(table, 'patientId');
    // DESTRUCTIVE: hashes assigned to attachment records are lost; adopted legacy
    // rows whose filePath was cleared can no longer locate their content.
    await queryRunner.dropColumn(table, 'hash');
  }
}
