import { DataTypes, Sequelize, type UpsertOptions } from 'sequelize';
import { FACT_CURRENT_SYNC_TICK, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';

export class PatientFacility extends Model {
  declare id: string;
  declare patientId: string;
  declare facilityId: string;
  declare lastInteractedTime: Date;

  static initModel(options: InitOptions) {
    super.init(
      {
        id: {
          // patient facility records use a generated primary key that enforces one per patient,
          // even across a distributed sync system
          type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("facility_id", ';', ':')) STORED`,
          set() {
            // any sets of the convenience generated "id" field can be ignored
          },
        },
        patientId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'patients',
            key: 'id',
          },
        },
        facilityId: {
          type: DataTypes.STRING,
          primaryKey: true,
          references: {
            model: 'facilities',
            key: 'id',
          },
        },
        lastInteractedTime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        createdAtSyncTick: {
          type: DataTypes.BIGINT,
          allowNull: false,
          defaultValue: Sequelize.cast(
            Sequelize.fn('local_system_fact', FACT_CURRENT_SYNC_TICK, '0'),
            'bigint',
          ),
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static async createOrUpdate(values: Partial<PatientFacility>, options: UpsertOptions) {
    const [record] = await super.upsert(values, {
      returning: true,
      conflictFields: ['patient_id', 'facility_id'],
      ...options,
    } as UpsertOptions);
    return record;
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }

  static buildSyncFilter() {
    return `WHERE facility_id in (:facilityIds) AND ${this.tableName}.updated_at_sync_tick > :since`;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        facilityId: `${this.tableName}.facility_id`,
      }),
    };
  }
}
