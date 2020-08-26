import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';

import { Model } from './Model';

export class Referral extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        ...options,
        validate: {
          // mustHaveValidReferredById() {
          //   if (!this.referredBy) {
          //     throw new InvalidOperationError('A referral must have a valid referrer');
          //   }
          // },
          // mustHaveValidReferredToId() {
          //   if (!this.referredTo) {
          //     throw new InvalidOperationError('A referral must have a valid referree');
          //   }
          // },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['referredBy', 'referredTo'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });
    this.belongsTo(models.User, {
      foreignKey: 'referredById',
      as: 'referredBy',
    });
    this.belongsTo(models.User, {
      foreignKey: 'referredToId',
      as: 'referredTo',
    });
  }
}
