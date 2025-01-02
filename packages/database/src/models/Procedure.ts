import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class Procedure extends Model {
  id!: string;
  completed!: boolean;
  date!: string;
  endTime?: string;
  startTime?: string;
  note?: string;
  completedNote?: string;
  encounterId?: string;
  locationId?: string;
  procedureTypeId?: string;
  physicianId?: string;
  assistantId?: string;
  anaesthetistId?: string;
  anaestheticId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        completed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        date: dateTimeType('date', { allowNull: false }),
        endTime: dateTimeType('endTime'),
        startTime: dateTimeType('startTime'),
        note: DataTypes.TEXT,
        completedNote: DataTypes.TEXT,
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static getListReferenceAssociations() {
    return ['Location', 'ProcedureType', 'Anaesthetic'];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'ProcedureType',
    });
    this.belongsTo(models.User, {
      foreignKey: 'physicianId',
      as: 'Physician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'assistantId',
      as: 'Assistant',
    });
    this.belongsTo(models.User, {
      foreignKey: 'anaesthetistId',
      as: 'Anaesthetist',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'anaestheticId',
      as: 'Anaesthetic',
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

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
