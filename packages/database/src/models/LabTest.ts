import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateTimeType, dateType, type InitOptions, type Models } from '../types/model';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { SessionConfig } from '../types/sync';
import type { LabTestType } from './LabTestType';

export class LabTest extends Model {
  id!: string;
  date!: string;
  result!: string;
  laboratoryOfficer?: string;
  verification?: string;
  completedDate?: string;
  labRequestId?: string;
  categoryId?: string;
  labTestMethodId?: string;
  labTestTypeId?: string;
  labTestType?: LabTestType;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', { allowNull: false, defaultValue: getCurrentDateString }),
        result: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '',
        },
        laboratoryOfficer: {
          type: DataTypes.STRING,
        },
        verification: {
          type: DataTypes.STRING,
        },
        completedDate: dateTimeType('completedDate'),
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestMethodId',
      as: 'labTestMethod',
    });

    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }

  static getListReferenceAssociations() {
    return ['category', 'labTestType', 'labTestMethod'];
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab tests
    }
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'lab_requests', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
        isLabRequestValue: 'TRUE',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'lab_requests', 'encounters']),
    };
  }
}
