import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'blobs';

// spec: AV
// The antivirus verdict held against each blob, and the scanner it came from.
// Orthogonal to integrityState: infected content matches its hash, so a verdict
// says nothing about integrity and integrity says nothing about a verdict. Null
// verdict is not-yet-scanned, which is every blob until a verdict is recorded.
const SCAN_COLUMNS = [
  new TableColumn({
    name: 'scanVerdict',
    type: 'varchar',
    isNullable: true,
  }),
  new TableColumn({
    name: 'scannedAt',
    type: 'datetime',
    isNullable: true,
  }),
  new TableColumn({
    name: 'scannerVersion',
    type: 'varchar',
    isNullable: true,
  }),
  new TableColumn({
    name: 'signatureVersion',
    type: 'varchar',
    isNullable: true,
  }),
];

export class addBlobScanColumns1785920000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(TABLE_NAME, SCAN_COLUMNS);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(TABLE_NAME, SCAN_COLUMNS);
  }
}
