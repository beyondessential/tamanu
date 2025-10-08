import { QueryRunner } from 'typeorm';

export const triggerFullResync = async (queryRunner: QueryRunner, tableName: string) => {
  await queryRunner.query(
    `
        INSERT INTO local_system_fact (id, key, value)
        VALUES (lower(
          hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
          substr(hex( randomblob(2)), 2) || '-' ||
          substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
          substr(hex(randomblob(2)), 2) || '-' ||
          hex(randomblob(6))
        ), 'tablesForFullResync', ?)
      `,
    [tableName],
  );
};
