import { Sequelize } from 'sequelize';
import { LAB_TEST_STATUSES, SYNC_DIRECTIONS } from 'shared/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';

const LAB_TEST_STATUS_VALUES = Object.values(LAB_TEST_STATUSES);

export class LabTest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
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
        completedDate: {
          type: Sequelize.DATE,
        },
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

  static buildSyncFilter(patientIds, facilitySettings) {
    return buildEncounterLinkedSyncFilter(patientIds, facilitySettings, [
      'labRequest',
      'encounter',
    ]);
  }
}
