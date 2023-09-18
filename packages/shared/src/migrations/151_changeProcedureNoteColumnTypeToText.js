import Sequelize from 'sequelize';

export async function up(query) {
  await query.changeColumn('procedures', 'note', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}

// The following query results in loss of data
// (all characters past the 256th character)
export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE procedures
    ALTER COLUMN note
    TYPE VARCHAR(255)
    USING note::VARCHAR(255)
  `);
}
