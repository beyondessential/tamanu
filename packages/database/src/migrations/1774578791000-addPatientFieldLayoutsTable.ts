import { DataTypes, QueryInterface, Op } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('patient_field_layouts', {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    field_source: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    field_key: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    definition_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: { model: 'patient_field_definitions', key: 'id' },
    },
    section: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: { model: 'patient_field_definition_categories', key: 'id' },
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    can_hide: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    can_delete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: -999,
    },
  });

  // A field is identified by exactly one of field_key or definition_id
  await query.sequelize.query(`
    ALTER TABLE patient_field_layouts
    ADD CONSTRAINT patient_field_layouts_field_identification CHECK (
      (field_key IS NOT NULL AND definition_id IS NULL)
      OR (field_key IS NULL AND definition_id IS NOT NULL)
    );
  `);

  // A field belongs to exactly one of a fixed section or a custom category
  await query.sequelize.query(`
    ALTER TABLE patient_field_layouts
    ADD CONSTRAINT patient_field_layouts_section_assignment CHECK (
      (section IS NOT NULL AND category_id IS NULL)
      OR (section IS NULL AND category_id IS NOT NULL)
    );
  `);

  // Prevent duplicate layout entries for the same built-in field
  await query.addIndex('patient_field_layouts', {
    fields: ['field_key'],
    unique: true,
    where: { field_key: { [Op.ne]: null }, deleted_at: null },
    name: 'patient_field_layouts_field_key_unique',
  } as any);

  // Prevent duplicate layout entries for the same custom field
  await query.addIndex('patient_field_layouts', {
    fields: ['definition_id'],
    unique: true,
    where: { definition_id: { [Op.ne]: null }, deleted_at: null },
    name: 'patient_field_layouts_definition_id_unique',
  } as any);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('patient_field_layouts');
}
