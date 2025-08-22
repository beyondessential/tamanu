import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/shared/errors';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';

export class Discharge extends Model {
  declare id: string;
  declare note?: string;
  declare facilityName?: string;
  declare facilityAddress?: string;
  declare facilityTown?: string;
  declare encounterId?: string;
  declare dischargerId?: string;
  declare dispositionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        facilityName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        facilityAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        facilityTown: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveEncounter() {
            if (!this.deletedAt && !this.encounterId) {
              throw new InvalidOperationError('A discharge must have an encounter.');
            }
          },
        },
      },
    );
  }

  static getFullReferenceAssociations() {
    return ['discharger', 'disposition'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.User, {
      foreignKey: 'dischargerId',
      as: 'discharger',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'dispositionId',
      as: 'disposition',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
