import { QueryInterface } from 'sequelize';

const replacements = {
  type: 'imagingType',
};

export async function up(query: QueryInterface) {
  // Remove imagingType reference data as it is now generically defined in localisation
  await query.sequelize.query(
    `
      DELETE FROM reference_data
      WHERE type = :type
    `,
    { replacements },
  );
}

export async function down() {
  // Destructive migration.
}
