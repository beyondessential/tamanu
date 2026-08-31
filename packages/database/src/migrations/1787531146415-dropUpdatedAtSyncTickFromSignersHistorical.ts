import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'signers_historical';
const COLUMN = 'updated_at_sync_tick';
const TRIGGER = 'set_signers_updated_at_sync_tick';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP TRIGGER IF EXISTS "${TRIGGER}" ON "${TABLE}";`);
  await query.sequelize.query(`ALTER TABLE "${TABLE}" DROP COLUMN IF EXISTS "${COLUMN}";`);
}

// DESTRUCTIVE: original updated_at_sync_tick values will not be restored
export async function down(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, COLUMN, {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  });
  await query.sequelize.query(`
    CREATE TRIGGER "${TRIGGER}"
    BEFORE INSERT OR UPDATE ON "${TABLE}"
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_sync_tick();
  `);
}
