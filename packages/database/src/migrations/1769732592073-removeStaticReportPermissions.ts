import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
    await query.sequelize.query(
      `
        DELETE FROM permissions
        WHERE noun = 'StaticReport'
          AND verb = 'run'
          AND object_id <> 'generic-survey-export-line-list'
      `,
    );
}

export async function down(_query: QueryInterface): Promise<void> {
  // Cannot restore deleted permissions as we don't have a record of what they were
}
