import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import type { Department } from '../Department';
import type { User } from '../User';
import type { Location } from '../Location';
import type { Encounter } from '../Encounter';
import { afterCreateHook, afterDestroyHook, afterUpdateHook } from './hooks';

export class Procedure extends Model {
  declare id: string;
  declare completed: boolean;
  declare date: string;
  declare endTime?: string;
  declare startTime?: string;
  declare note?: string;
  declare completedNote?: string;
  declare encounterId?: string;
  declare locationId?: string;
  declare procedureTypeId?: string;
  declare physicianId?: string;
  declare anaesthetistId?: string;
  declare anaestheticId?: string;
  declare departmentId?: string;
  declare assistantAnaesthetistId?: string;
  declare timeIn?: string;
  declare timeOut?: string;

  declare encounter?: Encounter;
  declare location?: Location;
  declare department?: Department;
  declare leadClinician?: User;
  declare anaesthetist?: User;
  declare assistantAnaesthetist?: User;

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
        timeIn: dateTimeType('timeIn'),
        timeOut: dateTimeType('timeOut'),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          afterCreate: afterCreateHook,
          afterUpdate: afterUpdateHook,
          afterDestroy: afterDestroyHook,
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return [
      'location',
      'procedureType',
      'anaesthetic',
      'department',
      'assistantClinicians',
      'surveyResponses',
    ];
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'procedureTypeId',
      as: 'procedureType',
    });
    this.belongsTo(models.User, {
      foreignKey: 'physicianId',
      as: 'leadClinician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'anaesthetistId',
      as: 'anaesthetist',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'anaestheticId',
      as: 'anaesthetic',
    });
    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });
    this.belongsTo(models.User, {
      foreignKey: 'assistantAnaesthetistId',
      as: 'assistantAnaesthetist',
    });

    this.belongsToMany(models.User, {
      through: 'ProcedureAssistantClinician',
      as: 'assistantClinicians',
      foreignKey: 'procedureId',
    });
    this.belongsToMany(models.SurveyResponse, {
      through: 'ProcedureSurveyResponse',
      as: 'surveyResponses',
      foreignKey: 'procedureId',
    });
  }

  forResponse() {
    const procedureResponse = super.forResponse();
    const assistantClinicians = this.dataValues?.AssistantClinicians;
    if (!assistantClinicians) {
      return procedureResponse;
    }

    // Parse the nested many to many data for assistantClinicians
    const assistantCliniciansData = assistantClinicians.map(
      (assistantClinician: { forResponse: () => any }) => assistantClinician.forResponse(),
    );

    return {
      ...procedureResponse,
      assistantClinicians: assistantCliniciansData,
    };
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
