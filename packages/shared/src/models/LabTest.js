import { Sequelize } from 'sequelize';
import { LAB_TEST_STATUSES, SYNC_DIRECTIONS } from '../constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateType, dateTimeType } from './dateTimeTypes';
import { getCurrentDateString } from '../utils/dateTime';

const LAB_TEST_STATUS_VALUES = Object.values(LAB_TEST_STATUSES);

export class LabTest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateType('date', { allowNull: false, defaultValue: getCurrentDateString }),
        status: {
          type: Sequelize.STRING(31),
          allowNull: false,
          defaultValue: LAB_TEST_STATUSES.RECEPTION_PENDING,
          isIn: [LAB_TEST_STATUS_VALUES], // double array is intentional
        },
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

  static buildPatientSyncFilter(patientIds, sessionConfig) {
    if (sessionConfig.syncAllLabRequests) {
      return ''; // include all lab tests
    }
    if (patientIds.length === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter([this.tableName, 'lab_requests', 'encounters']);
  }
}
