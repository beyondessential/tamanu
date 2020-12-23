import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';

import { Model } from './Model';

// TODO: investigate how this model has diverged from sync-server and mobile
export class Immunisation extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        schedule: Sequelize.STRING,
        vaccine: Sequelize.STRING,
        batch: Sequelize.STRING,
        timeliness: Sequelize.STRING,

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
              throw new InvalidOperationError('A immunisation must have a valid patient');
            }
          },
          mustHaveValidGivenById() {
            if (!this.givenById) {
              throw new InvalidOperationError(
                'A immunisation must have a valid administerer (givenBy)',
              );
            }
          },
        },
      },
    );
  }

  static getListReferenceAssociations() {
    return ['facility', 'givenBy', 'patient'];
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.User, {
      foreignKey: 'givenById',
      as: 'givenBy',
    });
  }
}
