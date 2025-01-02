import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class PatientSecondaryId extends Model {
  id!: string;
  value!: string;
  visibilityStatus!: string;
  patientId?: string;
  typeId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        value: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'typeId',
      as: 'type',
    });
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
