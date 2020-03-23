import { Sequelize } from 'sequelize';
import { LAB_TEST_STATUSES } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
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
          type: Sequelize.ENUM(LAB_TEST_STATUS_VALUES),
          allowNull: false,
          defaultValue: LAB_TEST_STATUSES.RECEPTION_PENDING,
        },
        result: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'categoryId',
    });

    this.belongsTo(models.LabTestType, {
      foreignKey: 'labTestTypeId',
    });
  }
}
