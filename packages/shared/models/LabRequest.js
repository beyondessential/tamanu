import { Sequelize } from 'sequelize';
import { Model } from './Model';

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
          type: Sequelize.TEXT,
          allowNull: true,
        },
        sampleId: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      },
      {
        ...options,
        validate: {
          mustHaveValidRelationType() {
            if (!NOTE_OBJECT_TYPE_VALUES.includes(this.objectType)) {
              throw new Error(`Must have a valid type (got ${this.objectType})`);
            }
          },
          mustHaveContent() {
            if (this.content === '') {
              throw new Error('Content must not be empty');
            }
          },
        },
      },
    );
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
