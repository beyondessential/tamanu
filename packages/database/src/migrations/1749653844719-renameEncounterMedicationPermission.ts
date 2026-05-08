import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.transaction(async (transaction) => {
    await query.sequelize.query(
      `
        UPDATE "permissions"
        SET "noun" = 'Medication'
        WHERE "noun" = 'EncounterMedication';
      `,
      { transaction },
    );
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.transaction(async (transaction) => {
    await query.sequelize.query(
      `
        UPDATE "permissions"
        SET "noun" = 'EncounterMedication'
        WHERE "noun" = 'Medication';
      `,
      { transaction },
    );
  });
}
