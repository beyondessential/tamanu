import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addNoteTypeIdColumn1761474536816 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'note',
      new TableColumn({
        name: 'noteTypeId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE note
      SET noteTypeId = 'notetype-' || noteType
      WHERE noteType IS NOT NULL
    `);

    await queryRunner.dropColumn('note', 'noteType');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'note',
      new TableColumn({
        name: 'noteType',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE note
      SET noteType = REPLACE(noteTypeId, 'notetype-', '')
      WHERE noteTypeId IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE note
      SET noteType = 'other'
      WHERE noteType IS NULL
    `);

    await queryRunner.dropColumn('note', 'noteTypeId');
  }
}
