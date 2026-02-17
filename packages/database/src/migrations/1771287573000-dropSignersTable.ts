import { type QueryInterface } from 'sequelize';

const OLD_TABLE = 'signers';
const NEW_TABLE = 'signers_historical';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`UPDATE ${OLD_TABLE} SET private_key = NULL`);
  await query.renameTable(OLD_TABLE, NEW_TABLE);

  const [[{ delete_after }]]: any = await query.sequelize.query(
    `SELECT COALESCE(
      to_char(MAX(validity_period_end) + INTERVAL '7 years', 'YYYY-MM-DD'),
      to_char(NOW() + INTERVAL '7 years', 'YYYY-MM-DD')
    ) AS delete_after FROM ${NEW_TABLE}`,
  );

  await query.sequelize.query(
    `COMMENT ON TABLE ${NEW_TABLE} IS $comment$Historical VDS-NC signer records retained for compliance. Private keys cleared. Safe to DROP after ${delete_after}.$comment$`,
  );
}

// DESTRUCTIVE: Private key data will not be restored
export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`COMMENT ON TABLE ${NEW_TABLE} IS NULL`);
  await query.renameTable(NEW_TABLE, OLD_TABLE);
}
