import { Sequelize } from 'sequelize';

import { InvalidOperationError } from 'shared/errors';

import { Model } from './Model';

// TODO: this model is deprecated, and should be removed once the lan server can
// be migrated to use ScheduledVaccine and AdministeredVaccine
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
