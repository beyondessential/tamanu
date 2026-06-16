import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model.ts';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId.ts';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter.ts';
import type { InitOptions, Models } from '../types/model.ts';

export class PatientContact extends Model {
  declare id: string;
  declare name: string;
  declare method: string;
  declare connectionDetails?: Record<string, any>;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        method: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        connectionDetails: DataTypes.JSONB,
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
      foreignKey: 'relationshipId',
      as: 'relationship',
    });
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;

  static getListReferenceAssociations() {
    return ['relationship'];
  }
}
