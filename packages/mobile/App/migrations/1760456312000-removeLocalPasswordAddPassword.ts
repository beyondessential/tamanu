import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class removeLocalPasswordAddPassword1760456312000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Get the user table
    const userTable = await getTable(queryRunner, 'users');

    // Remove the localPassword column
    await queryRunner.dropColumn(userTable, 'localPassword');

    // Add the new password column (nullable, text type)
    await queryRunner.addColumn(
      userTable,
      new TableColumn({
        name: 'password',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Get the user table
    const userTable = await getTable(queryRunner, 'user');

    // Remove the password column
    await queryRunner.dropColumn(userTable, 'password');

    // Add back the localPassword column
    await queryRunner.addColumn(
      userTable,
      new TableColumn({
        name: 'localPassword',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
