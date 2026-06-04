import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

/**
 * A WebAuthn (passkey) credential enrolled by a user.
 *
 * Only the public key is stored, so the rows are safe to replicate: they sync
 * everywhere (BIDIRECTIONAL), letting a credential enrolled at one server be
 * verified offline at any other in-zone server. The private key never leaves
 * the user's authenticator.
 *
 * The WebAuthn signature counter is deliberately not stored: we never enforce
 * it (synced passkeys report 0 by design, and counter regressions are routine
 * across a sync-lagged topology), so verifiers are passed a stored counter of
 * 0, which disables the regression check.
 */
export class WebAuthnCredential extends Model {
  declare id: string;
  declare credentialId: string;
  declare publicKey: string;
  declare rpId: string;
  declare transports?: string[];
  declare aaguid?: string;
  declare enrolmentOrigin?: string;
  declare friendlyName?: string;
  declare lastUsedAt?: Date;
  declare userId: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        // base64url credential ID as minted by the authenticator; globally unique
        credentialId: { type: DataTypes.TEXT, allowNull: false },
        // base64url COSE public key — public data, safe to sync
        publicKey: { type: DataTypes.TEXT, allowNull: false },
        // the relying party ID the credential is bound to; the browser only
        // permits assertions at origins this is a registrable suffix of
        rpId: { type: DataTypes.TEXT, allowNull: false },
        // authenticator transports reported at registration (e.g. internal,
        // hybrid, usb); echoed in allowCredentials so browsers know how to
        // reach the authenticator
        transports: { type: DataTypes.JSONB, allowNull: true },
        // Authenticator Attestation GUID: identifies the authenticator
        // make/model (e.g. iCloud Keychain vs a YubiKey 5), where the
        // authenticator chooses to report it. Display/audit only.
        aaguid: { type: DataTypes.TEXT, allowNull: true },
        // the web origin the registration ceremony ran at, for audit
        enrolmentOrigin: { type: DataTypes.TEXT, allowNull: true },
        friendlyName: { type: DataTypes.TEXT, allowNull: true },
        lastUsedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        ...options,
        // sequelize would otherwise derive web_authn_credentials
        tableName: 'webauthn_credentials',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static buildSyncFilter() {
    return null; // syncs everywhere — public keys, verifiable offline at any in-zone server
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'user',
    });
  }
}
