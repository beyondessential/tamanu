import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

const INJECTION_SITE_OPTIONS = [
  'Left arm',
  'Right arm',
  'Left thigh',
  'Right thigh',
  'Oral',
  'Other',
];

export class AdministeredVaccine extends Model {
  static init({ primaryKey, ...options }) {
    options.validate = {
      mustHaveScheduledVaccine() {
        if (!this.deletedAt && !this.scheduledVaccineId) {
          throw new InvalidOperationError('An administered vaccine must have a scheduled vaccine.');
        }
      },
      mustHaveEncounter() {
        if (!this.deletedAt && !this.encounterId) {
          throw new InvalidOperationError('An administered vaccine must have an encounter.');
        }
      },
    };
    super.init(
      {
        id: primaryKey,
        batch: Sequelize.STRING,
        status: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        reason: Sequelize.STRING,
        location: Sequelize.STRING,
        injectionSite: Sequelize.STRING,
        date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      },
      options,
    );
  }

  static getListReferenceAssociations() {
    return ['encounter', 'scheduledVaccine'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.belongsTo(models.ScheduledVaccine, {
      foreignKey: 'scheduledVaccineId',
      as: 'scheduledVaccine',
    });
  }
}
