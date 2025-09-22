import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { Department } from './Department';
import type { User } from './User';
import type { Location } from './Location';
import type { Encounter } from './Encounter';

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
  declare Location?: Location;
  declare Department?: Department;
  declare LeadClinician?: User;
  declare Anaesthetist?: User;
  declare AssistantAnaesthetist?: User;

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
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static getListReferenceAssociations() {
    return [
      'Location',
      'ProcedureType',
      'Anaesthetic',
      'Department',
      'AssistantClinicians',
      'SurveyResponses',
    ];
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
      as: 'LeadClinician',
    });
    this.belongsTo(models.User, {
      foreignKey: 'anaesthetistId',
      as: 'Anaesthetist',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'anaestheticId',
      as: 'Anaesthetic',
    });
    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'Department',
    });
    this.belongsTo(models.User, {
      foreignKey: 'assistantAnaesthetistId',
      as: 'AssistantAnaesthetist',
    });

    this.belongsToMany(models.User, {
      through: 'ProcedureAssistantClinician',
      as: 'AssistantClinicians',
      foreignKey: 'procedureId',
    });
    this.belongsToMany(models.SurveyResponse, {
      through: 'ProcedureSurveyResponse',
      as: 'SurveyResponses',
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
