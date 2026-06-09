import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Records whether the authenticator verified the user (PIN/biometric) at
 * registration, from the authenticator data UV flag. true ⇒ the passkey is a
 * user-verifying factor (possession + inherence); false ⇒ presence-only (e.g.
 * a basic security key), usable only as a second factor; null for credentials
 * enrolled before this was tracked.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('webauthn_credentials', 'user_verified', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('webauthn_credentials', 'user_verified');
}
