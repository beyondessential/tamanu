import { DataTypes, QueryTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import type { InitOptions, Models } from '../types/model';
import { Facility } from './Facility';
import { log } from '@tamanu/shared/services/logging';

export interface Address {
  name?: string;
  address?: string;
  town?: string;
}

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

  async address(): Promise<Address> {
    const encounterFacility = await this.sequelize
      .query(
        `
        SELECT f.* FROM encounters e
        JOIN locations l on l.id = e.location_id
        JOIN facilities f on f.id = l.facility_id
        WHERE e.id = $encounterId
        `,
        {
          type: QueryTypes.SELECT,
          model: Facility,
          mapToModel: true,
          bind: {
            encounterId: this.encounterId,
          },
        },
      )
      .then(
        (res: Facility[]) => res?.[0],
        (err: Error) => {
          log.warn('Failed to fetch encounter facility', err);
          return null;
        },
      );

    return {
      name: encounterFacility?.name ?? this.facilityName,
      address: encounterFacility?.streetAddress ?? this.facilityAddress,
      town: encounterFacility?.cityTown ?? this.facilityTown,
    };
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
