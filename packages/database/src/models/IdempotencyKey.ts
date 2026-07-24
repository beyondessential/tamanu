import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// spec: IDEM
//
// Records the outcome of a mutating request that carried an `Idempotency-Key`
// header, so a client that retries the request after a dropped connection gets
// the original outcome back instead of executing the operation a second time.
//
// Operational state local to each server — DO_NOT_SYNC (like RefreshToken /
// OneTimeLogin), and excluded from change logging (see services/migrations/
// constants.ts) so recorded response bodies never reach logs.changes. The table
// ships on both central and facility, but only the facility server mounts the
// middleware that writes to it; on central it sits empty until that surface is
// classified and the middleware is mounted there too.
export const IDEMPOTENCY_KEY_STATUSES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export class IdempotencyKey extends Model {
  declare id: string;
  declare key: string;
  declare userId: string;
  declare facilityId: string;
  declare method: string;
  declare path: string;
  declare requestHash: string;
  declare status: string;
  declare responseStatus?: number;
  declare responseBody?: unknown;
  declare claimedAt: Date;
  declare completedAt?: Date;
  declare expiresAt: Date;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        key: { type: DataTypes.TEXT, allowNull: false },
        method: { type: DataTypes.TEXT, allowNull: false },
        path: { type: DataTypes.TEXT, allowNull: false },
        // Fingerprint of method + path + body: catches the same key being reused
        // for a different request, which is a client bug rather than a retry.
        requestHash: { type: DataTypes.TEXT, allowNull: false },
        status: { type: DataTypes.TEXT, allowNull: false },
        // Set together when the operation completes and commits.
        responseStatus: { type: DataTypes.INTEGER, allowNull: true },
        responseBody: { type: DataTypes.JSONB, allowNull: true },
        // When the in-progress claim was taken — drives the lease that reclaims a
        // claim abandoned by a server crash (only reachable once a committed
        // in-progress marker is used; see the plan's transaction-topology note).
        claimedAt: { type: DataTypes.DATE, allowNull: false },
        completedAt: { type: DataTypes.DATE, allowNull: true },
        // Retention horizon: a background task deletes keys past this point.
        expiresAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [
          {
            name: 'idempotency_keys_key_user_facility',
            fields: ['key', 'user_id', 'facility_id'],
            unique: true,
          },
          { name: 'idempotency_keys_expires_at', fields: ['expires_at'] },
          { name: 'idempotency_keys_status_claimed_at', fields: ['status', 'claimed_at'] },
        ],
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, { foreignKey: 'userId' });
    this.belongsTo(models.Facility, { foreignKey: 'facilityId' });
  }
}
