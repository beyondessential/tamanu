import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';

export class PatientFacility extends Model {
  declare id: string;
  declare patientId: string;
  declare facilityId: string;

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
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        facilityId: `${this.tableName}.facility_id`,
      }),
    };
  }
}
