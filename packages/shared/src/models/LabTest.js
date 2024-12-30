import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateTimeType, dateType } from './dateTimeTypes';
import { getCurrentDateString } from '../utils/dateTime';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class LabTest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', { allowNull: false, defaultValue: getCurrentDateString }),
        result: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        laboratoryOfficer: {
          type: Sequelize.STRING,
        },
        verification: {
          type: Sequelize.STRING,
        },
        completedDate: dateTimeType('completedDate'),
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
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

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable, sessionConfig) {
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
