import { DataTypes } from 'sequelize';
import { DRUG_STOCK_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        facilityId: `${this.tableName}.facility_id`,
      }),
      joins: '',
    };
  }
}
