import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
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

        discontinued: Sequelize.BOOLEAN,
        discontinuedDate: Sequelize.STRING,
        discontinuingReason: Sequelize.STRING,
        repeats: Sequelize.INTEGER,
        isDischarge: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
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
    this.belongsTo(models.User, {
      foreignKey: 'discontinuingClinicianId',
      as: 'discontinuingClinician',
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
    return ['Medication', 'encounter', 'prescriber', 'discontinuingClinician'];
  }
}
