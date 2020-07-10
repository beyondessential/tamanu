import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';

import { LAB_REQUEST_STATUSES } from 'shared/constants';
import { Model } from './Model';

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

        note: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      options,
    );
  }

  static create(data) {
    return this.sequelize.transaction(async () => {
      const { labTestTypeIds = [] } = data;
      if (!labTestTypeIds.length) {
        throw new InvalidOperationError('A request must have at least one test');
      }

      const base = await super.create(data);

      // then create tests
      const { LabTest } = this.sequelize.models;

      await Promise.all(
        labTestTypeIds.map(t =>
          LabTest.create({
            labTestTypeId: t,
            labRequestId: base.id,
          }),
        ),
      );

      return base;
    });
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'requestedById',
      as: 'requestedBy',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'labTestCategoryId',
      as: 'category',
    });

    this.hasMany(models.LabTest, { as: 'tests' });
  }

  static getListReferenceAssociations() {
    return ['requestedBy', 'category'];
  }

  getTests() {
    return this.sequelize.models.LabTest.findAll({
      where: { labRequestId: this.id },
    });
  }
}
