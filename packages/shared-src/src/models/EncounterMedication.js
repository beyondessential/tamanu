import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class EncounterMedication extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        endDate: Sequelize.DATE,

        prescription: Sequelize.STRING,
        note: Sequelize.STRING,
        indication: Sequelize.STRING,
        route: Sequelize.STRING,

        qtyMorning: Sequelize.INTEGER,
        qtyLunch: Sequelize.INTEGER,
        qtyEvening: Sequelize.INTEGER,
        qtyNight: Sequelize.INTEGER,
      },
      {
        ...options,
        validate: {
          mustHaveMedication() {
            if (!this.medicationId) {
              throw new Error('An encounter medication must be attached to a medication.');
            }
          },
          mustHaveEncounter() {
            if (!this.encounterId) {
              throw new Error('An encounter medication must be attached to an encounter.');
            }
          },
          mustHavePrescriber() {
            if (!this.prescriberId) {
              throw new Error('An encounter medication must be attached to a prescriber.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'prescriberId',
    });
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'Medication',
    });
  }

  static getListReferenceAssociations() {
    return ['Medication'];
  }
}
