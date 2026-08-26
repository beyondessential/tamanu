import { DataTypes, Op, type DestroyOptions } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions } from '../types/model';

const REFUSE_DELETE_HOOK = 'refuseDeleteWithMemberFacilities';

// A named group of facilities that share confidential data. A facility is sensitive exactly when
// it belongs to a network, so there is no separate sensitivity flag.
// spec: specs/sync/sensitive-networks.md
export class SensitiveNetwork extends Model {
  declare id: string;
  declare code: string;
  declare name: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [
          { unique: true, fields: ['code'] },
          { unique: true, fields: ['name'] },
        ],
      },
    );

    // Sequelize gives no way to ask which hooks a model already carries, so remove before adding.
    this.removeHook('beforeDestroy', REFUSE_DELETE_HOOK);
    this.addHook('beforeDestroy', REFUSE_DELETE_HOOK, async (network: SensitiveNetwork) => {
      await this.assertNoMemberFacilities([network.id]);
    });

    this.removeHook('beforeBulkDestroy', REFUSE_DELETE_HOOK);
    this.addHook('beforeBulkDestroy', REFUSE_DELETE_HOOK, async (destroyOptions: DestroyOptions) => {
      const targeted = await this.findAll({
        where: destroyOptions.where ?? {},
        attributes: ['id'],
        raw: true,
      });
      await this.assertNoMemberFacilities(targeted.map(({ id }) => id));
    });
  }

  // Deleting a network with members would leave each of them pointing at a deleted network, and
  // either still sensitive with nothing to name them or turned ordinary and syncing confidential
  // data everywhere.
  static async assertNoMemberFacilities(networkIds: string[]) {
    if (networkIds.length === 0) return;

    // Soft-deleted facilities count. They still carry the reference, so restoring one would
    // otherwise leave it pointing at a network that no longer exists.
    const memberCount = await this.sequelize.models.Facility.count({
      where: { sensitiveNetworkId: { [Op.in]: networkIds } },
      paranoid: false,
    });

    if (memberCount > 0) {
      throw new InvalidOperationError(
        'A sensitive network cannot be deleted while facilities belong to it',
      );
    }
  }

  // No initRelations, deliberately. The generic beforeDestroy hook cascades a soft delete to every
  // HasMany and HasOne target, so declaring facilities as this model's children would delete a
  // network's members rather than refuse the delete. Facility.belongsTo carries the association,
  // and is also what sync's dependency ordering reads.

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
