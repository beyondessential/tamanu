import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';

import { Model } from './Model';

export class Referral extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        referralNumber: Sequelize.STRING,

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        ...options,
        validate: {
          mustHaveValidPatient() {
            if (!this.patientId) {
              throw new InvalidOperationError('A referral must have a valid patient');
            }
          },
          mustHaveValidReferredById() {
            if (!this.referredById) {
              throw new InvalidOperationError('A referral must have a valid referrer');
            }
          },
          // mustHaveValidReferredToId() {
          //   if (!this.referredToId) {
          //     throw new InvalidOperationError('A referral must have a valid referree');
          //   }
          // },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['department', 'referredBy', 'referredTo', 'patient'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'departmentId',
      as: 'department',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
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
