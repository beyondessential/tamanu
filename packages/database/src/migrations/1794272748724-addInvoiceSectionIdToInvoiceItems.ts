import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'invoice_items';

// Records which section of a split invoice an item belongs to, fixed when the item is added.
// Nullable because an item added before this column existed has no section, and because an
// encounter type that is never sectioned resolves to none. Nothing is backfilled: the section
// cannot be recovered from an item's date, which carries no time.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'invoice_section_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: this discards the recorded section of every invoice item. It cannot be rebuilt
  // afterwards, because an item's date carries no time and so cannot place it on its own.
  await query.removeColumn(TABLE, 'invoice_section_id');
}
