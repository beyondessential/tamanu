import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class Discharge extends Model {
  static init({ primaryKey, ...options }) {
    const validate = {
      mustHaveEncounter() {
        if (!this.deletedAt && !this.encounterId) {
          throw new InvalidOperationError('A discharge must have an encounter.');
        }
      },
    };
    super.init(
      {
        id: primaryKey,
        note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        facilityName: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        facilityAddress: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        facilityTown: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate,
      },
    );
  }

  static getFullReferenceAssociations() {
    return ['discharger', 'disposition'];
  }

  static initRelations(models) {
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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
