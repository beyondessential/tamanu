import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Mirror of totp_secrets.confirmed_at on the synced user row. The TOTP seed is
 * central-only (symmetric secret), but the *fact* that a user has a confirmed
 * authenticator app is not secret, and facilities need it to show truthful MFA
 * status. Central maintains it on enrol/confirm/reset.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('users', 'totp_confirmed_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('users', 'totp_confirmed_at');
}
