import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const REFERENCE_DRUGS_TABLE = 'reference_drugs';

export class addIsSensitiveColumnToReferenceDrugsTable1753911142171 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      REFERENCE_DRUGS_TABLE,
      new TableColumn({
        name: 'isSensitive',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(REFERENCE_DRUGS_TABLE, 'isSensitive');
  }
}
