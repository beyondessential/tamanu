import { DataTypes, Op, type DestroyOptions } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

// A named group of facilities that share confidential data. A facility is sensitive exactly when
// it belongs to a network, so there is no separate sensitivity flag.
// spec: specs/sync/sensitive-networks.md
export class SensitiveNetwork extends Model {
  declare id: string;
  declare code: string;
  declare name: string;

  static initModel({ primaryKey, ...options }: InitOptions, models: Models) {
    super.init(
      {
        id: primaryKey,
        code: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        // No unique index on code or name: they are labels carried over from the facility each
        // network was made for, and facilities are not unique on either.
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );

    // Registered here rather than through init's `hooks` option, which Model.init overwrites with
    // the generic destroy hooks.
    this.addHook('beforeDestroy', async (network: SensitiveNetwork) => {
      await this.refuseIfAnyHasMembers([network.id], models);
    });
    this.addHook('beforeBulkDestroy', async (destroyOptions: DestroyOptions) => {
      const targeted = await SensitiveNetwork.findAll({
        ...destroyOptions,
        attributes: ['id'],
      });
      await this.refuseIfAnyHasMembers(
        targeted.map(({ id }) => id),
        models,
      );
    });
  }

  // Deleting a network with members would leave them pointing at a deleted row: they either stay
  // sensitive with nothing to name them, or turn ordinary and begin syncing confidential data
  // everywhere. A soft-deleted facility counts, because restoring it would strand it the same way,
  // hence `paranoid: false`.
  static async refuseIfAnyHasMembers(networkIds: string[], models: Models) {
    if (networkIds.length === 0) return;

    const members = await models.Facility.findAll({
      where: { sensitiveNetworkId: { [Op.in]: networkIds } },
      attributes: ['sensitiveNetworkId'],
      paranoid: false,
    });
    if (members.length === 0) return;

    const blocked = [...new Set(members.map(({ sensitiveNetworkId }) => sensitiveNetworkId))];
    throw new InvalidOperationError(
      `Cannot delete a sensitive network that still has member facilities: ${blocked.join(', ')}`,
    );
  }

  // No initRelations, deliberately. The generic beforeDestroy hook cascades a soft delete to every
  // HasMany and HasOne target, so declaring facilities as this model's children would soft-delete a
  // network's members. Facility.belongsTo carries the association, and is also what sync's
  // dependency ordering reads.

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
