import { QueryRunner } from 'typeorm';

export const triggerFullResync = async (queryRunner: QueryRunner, tables: string[]) => {
  const tableString = tables.join(',');
  // uuid generation based on
  // https://stackoverflow.com/questions/66625085/sqlite-generate-guid-uuid-on-select-into-statement
  await queryRunner.query(
    `
        INSERT INTO local_system_facts (id, key, value)
        VALUES (lower(
          hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
          substr(hex( randomblob(2)), 2) || '-' ||
          substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
          substr(hex(randomblob(2)), 2) || '-' ||
          hex(randomblob(6))
        ), 'tablesForFullResync', ?)
      `,
    [tableString],
  );
};
