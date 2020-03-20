import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { InvalidOperationError } from 'lan/app/errors';

import { LAB_REQUEST_STATUSES } from 'shared/constants';

const LAB_REQUEST_STATUS_VALUES = Object.values(LAB_REQUEST_STATUSES);

export class LabRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        sampleTime: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        requestedDate: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },

        urgent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        specimenAttached: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },

        status: {
          type: Sequelize.ENUM(LAB_REQUEST_STATUS_VALUES),
          defaultValue: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        },

        senaiteId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        sampleId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      options
    );
  }

  static create(data) {
    return this.sequelize.transaction(async () => {
      const base = await super.create(data);

      // then create tests
      const { LabTest } = this.sequelize.models;

      const { labTestTypeIds = [] } = data;
      if(!labTestTypeIds.length) {
        throw new InvalidOperationError("A request must have at least one test");
      }
      
      const newTests = await Promise.all(labTestTypeIds.map(t => LabTest.create({
        labTestTypeId: t,
        labRequestId: base.id,
      })));
      console.log("test", newTests);

      return base;
    });
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'requestedById',
    });

    this.belongsTo(models.Visit, {
      foreignKey: 'visitId',
    });
  }
}
