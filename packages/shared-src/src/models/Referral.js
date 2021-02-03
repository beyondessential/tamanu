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
        complete: {
          type: Sequelize.STRING,
          defaultValue: false,
          allowNull: false,
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
          mustHaveValidReferredToDepartmentId() {
            if (!this.referredToDepartmentId) {
              throw new InvalidOperationError('A referral must have a valid referree department');
            }
          },
          mustHaveValidReferredToFacilityId() {
            if (!this.referredToFacilityId) {
              throw new InvalidOperationError('A referral must have a valid referree facility');
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['referredToFacility', 'referredBy', 'referredToDepartment', 'patient'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.User, {
      foreignKey: 'referredById',
      as: 'referredBy',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referredToDepartmentId',
      as: 'referredToDepartment',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referredToFacilityId',
      as: 'referredToFacility',
    });
  }
}
