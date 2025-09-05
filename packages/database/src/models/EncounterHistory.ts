import { DataTypes } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { Encounter } from './Encounter';

export class EncounterHistory extends Model {
  declare id: string;
  declare encounterType: string;
  declare changeType?: string;
  declare date: string;
  declare encounterId?: string;
  declare examinerId?: string;
  declare locationId?: string;
  declare departmentId?: string;
  declare actorId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        encounterType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        changeType: {
          type: DataTypes.STRING,
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
      },
      {
        ...options,
        tableName: 'encounter_history',
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.User, {
      foreignKey: 'examinerId',
      as: 'examiner',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });

    this.belongsTo(models.User, {
      foreignKey: 'actorId',
      as: 'actor',
    });
  }

  static async createSnapshot(
    encounter: Encounter,
    {
      actorId,
      changeType,
      submittedTime,
    }: { actorId: string; changeType?: string; submittedTime?: string },
    options = {},
  ) {
    return EncounterHistory.create(
      {
        encounterId: encounter.id,
        encounterType: encounter.encounterType,
        locationId: encounter.locationId,
        departmentId: encounter.departmentId,
        examinerId: encounter.examinerId,
        actorId,
        changeType,
        date: submittedTime || getCurrentDateTimeString(),
      },
      options,
    );
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
