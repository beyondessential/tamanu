import { type ModelStatic, DataTypes } from 'sequelize';
import { LAB_TEST_STATUSES, SYNC_DIRECTIONS } from '@tamanu/constants';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '@tamanu/shared/models/buildEncounterLinkedSyncFilter';
import { dateTimeType, dateType } from '@tamanu/shared/models/dateTimeTypes';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { buildSyncLookupSelect } from '@tamanu/shared/sync/buildSyncLookupSelect';
import { Model } from './Model';
import { type ModelAttributes, type SessionConfig } from '../types/sequelize';

const LAB_TEST_STATUS_VALUES = Object.values(LAB_TEST_STATUSES);

export class LabTest extends Model {
  static init({ primaryKey, sequelize, ...options }: ModelAttributes) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', { allowNull: false, defaultValue: getCurrentDateString }),
        status: {
          type: DataTypes.STRING(31),
          allowNull: false,
          defaultValue: LAB_TEST_STATUSES.RECEPTION_PENDING,
          validate: {
            isIn: [LAB_TEST_STATUS_VALUES], // double array is intentional
          },
        },
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
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, primaryKey, sequelize, ...options },
    );
  }

  static initRelations(this: ModelStatic<LabTest>, models: { [key: string]: ModelStatic<any> }) {
    this.belongsTo(models.LabRequest!, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });

    this.belongsTo(models.ReferenceData!, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    this.belongsTo(models.ReferenceData!, {
      foreignKey: 'labTestMethodId',
      as: 'labTestMethod',
    });

    this.belongsTo(models.LabTestType!, {
      foreignKey: 'labTestTypeId',
      as: 'labTestType',
    });
  }

  static getListReferenceAssociations() {
    return ['category', 'labTestType', 'labTestMethod'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string, sessionConfig: SessionConfig) {
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
