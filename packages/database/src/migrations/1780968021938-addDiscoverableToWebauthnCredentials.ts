import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Records whether a passkey was stored as a discoverable (resident) credential,
 * from the credProps extension at registration. Drives whether it can be used
 * for passwordless login (true) or only as a second factor (false); null for
 * credentials enrolled before this was tracked, or where the browser didn't
 * report it.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('webauthn_credentials', 'discoverable', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('webauthn_credentials', 'discoverable');
}
