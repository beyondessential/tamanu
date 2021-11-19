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
        quantity: Sequelize.INTEGER,

        repeats: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          validate: {
            min: 0,
            max: 12,
          },
        },
        isDischarge: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
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
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'prescriberId',
      as: 'prescriber',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'Medication',
    });
  }

  static getListReferenceAssociations() {
    return ['Medication', 'encounter', 'prescriber'];
  }
}
