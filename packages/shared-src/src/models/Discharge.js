import { Sequelize } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class Discharge extends Model {
  static init({ primaryKey, ...options }) {
    const validate = {
      mustHaveEncounter() {
        if (!this.deletedAt && !this.encounterId) {
          throw new InvalidOperationError('A discharge must have an encounter.');
        }
      },
      mustHaveDischarger() {
        if (!this.deletedAt && !this.dischargerId) {
          throw new InvalidOperationError('A discharge must have a discharger.');
        }
      },
    };
    super.init(
      {
        id: primaryKey,
        note: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      { ...options, validate },
    );
  }

  static getFullReferenceAssociations() {
    return ['discharger', 'disposition'];
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.User, {
      foreignKey: 'dischargerId',
      as: 'discharger',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'dispositionId',
      as: 'disposition',
    });
  }
}
