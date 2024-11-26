import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateReferenceDataRelationIndex1714605577000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove the old index
    await queryRunner.query(`DROP INDEX IF EXISTS reference_data_id_type`);

    // Add the new index
    await queryRunner.query(`
      CREATE UNIQUE INDEX reference_data_relations_unique_index
      ON reference_data_relation (referenceDataId, referenceDataParentId, type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new index
    await queryRunner.query(`DROP INDEX IF EXISTS reference_data_relations_unique_index`);

    // Re-add the old index
    await queryRunner.query(`
      CREATE UNIQUE INDEX reference_data_id_type
      ON reference_data_relation (referenceDataId, type)
    `);
  }
}
