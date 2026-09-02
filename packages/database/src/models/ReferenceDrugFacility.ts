import { DataTypes } from 'sequelize';
import { DRUG_STOCK_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { ReadSettings } from '@tamanu/settings';
import { log } from '@tamanu/shared/services/logging';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class ReferenceDrugFacility extends Model {
  declare id: string;
  declare referenceDrugId: string;
  declare facilityId: string;
  declare quantity: number | null;
  declare stockStatus: string;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          type: `TEXT GENERATED ALWAYS AS (REPLACE("reference_drug_id", ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        referenceDrugId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'referenceDrugs',
            key: 'id',
          },
        },
        facilityId: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        stockStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: DRUG_STOCK_STATUSES.UNKNOWN,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.ReferenceDrug, {
      foreignKey: 'referenceDrugId',
      as: 'referenceDrug',
    });
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static buildSyncFilter() {
    return `WHERE ${this.tableName}.facility_id IN (:facilityIds) AND ${this.tableName}.updated_at_sync_tick > :since`;
  }

  static async prepareSanitizeContext(changes: { data: Record<string, any> }[]) {
    const facilityIds = [...new Set(changes.map(({ data }) => data.facilityId).filter(Boolean))];
    // TEMP DIAGNOSTIC (remove once the stock-on-hand clobber bug is found)
    log.info('ReferenceDrugFacility.prepareSanitizeContext: TEMP DIAGNOSTIC', {
      changeCount: changes.length,
      facilityIds,
    });

    const stockOnHandEnabledByFacilityId = new Map<string, boolean>();
    for (const facilityId of facilityIds) {
      const rawSetting = await new ReadSettings(this.sequelize!.models, facilityId).get(
        'integrations.mSupplyMed.stockOnHandEnabled',
      );
      const stockOnHandEnabled = Boolean(rawSetting);
      stockOnHandEnabledByFacilityId.set(facilityId, stockOnHandEnabled);
      // TEMP DIAGNOSTIC (remove once the stock-on-hand clobber bug is found)
      log.info('ReferenceDrugFacility.prepareSanitizeContext: TEMP DIAGNOSTIC resolved setting', {
        facilityId,
        rawSetting,
        rawSettingType: typeof rawSetting,
        stockOnHandEnabled,
      });
    }
    return stockOnHandEnabledByFacilityId;
  }

  // mSupply pushes stock updates straight into the facility's own DB, so central's copy of
  // quantity/stockStatus can be stale there — strip both so a sync pull never clobbers it.
  static sanitizeForFacilityServer(
    values: Record<string, any>,
    stockOnHandEnabledByFacilityId?: Map<string, boolean>,
  ) {
    const { facilityId, id, quantity, stockStatus } = values;
    const stockOnHandEnabled = stockOnHandEnabledByFacilityId?.get(facilityId);
    // TEMP DIAGNOSTIC (remove once the stock-on-hand clobber bug is found)
    log.info('ReferenceDrugFacility.sanitizeForFacilityServer: TEMP DIAGNOSTIC', {
      id,
      facilityId,
      quantity,
      stockStatus,
      hasContext: Boolean(stockOnHandEnabledByFacilityId),
      contextFacilityIds: stockOnHandEnabledByFacilityId
        ? [...stockOnHandEnabledByFacilityId.keys()]
        : null,
      stockOnHandEnabled,
      willStrip: Boolean(facilityId) && Boolean(stockOnHandEnabled),
    });

    if (!facilityId || !stockOnHandEnabled) return values;

    const { quantity: _quantity, stockStatus: _stockStatus, ...rest } = values;
    return rest;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        facilityId: `${this.tableName}.facility_id`,
      }),
      joins: '',
    };
  }
}
