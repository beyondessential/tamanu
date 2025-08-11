import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.createTable('reference_drugs', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    reference_data_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    route: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    units: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  const drugsReferenceData = await query.sequelize.query(`
    SELECT id from reference_data WHERE type = 'drug';
  `);
  if (drugsReferenceData[0].length) {
    await query.bulkInsert(
      'reference_drugs',
      drugsReferenceData[0].map((it: any) => ({
        id: Sequelize.literal(`uuid_generate_v5(
          uuid_generate_v5(uuid_nil(), 'reference_drugs'),
          '${it.id}'
        )`),
        reference_data_id: it.id,
      })),
    );
  }
}

export async function down(query: QueryInterface) {
  await query.dropTable('reference_drugs');
}
