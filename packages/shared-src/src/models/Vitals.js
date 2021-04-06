import { Sequelize } from 'sequelize';
import { AVPU_OPTIONS } from 'shared/constants';
import { Model } from './Model';

export class Vitals extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        dateRecorded: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        temperature: Sequelize.FLOAT,
        weight: Sequelize.FLOAT,
        height: Sequelize.FLOAT,
        sbp: Sequelize.FLOAT,
        dbp: Sequelize.FLOAT,
        heartRate: Sequelize.FLOAT,
        respiratoryRate: Sequelize.FLOAT,
        spo2: Sequelize.FLOAT,
        avpu: Sequelize.ENUM(AVPU_OPTIONS.map(x => x.value)),
      },
      {
        ...options,
        validate: {
          mustHaveEncounter() {
            if (!this.encounterId) {
              throw new Error('A vitals reading must be attached to an encounter.');
            }
          },
          mustHaveOneReading() {
            const allReadings = [
              this.temperature,
              this.height,
              this.weight,
              this.sbp,
              this.dbp,
              this.heartRate,
              this.respiratoryRate,
              this.spo2,
              this.avpu,
            ];
            if (!allReadings.some(x => x)) {
              throw new Error('At least one reading must be defined');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
    });
  }
}
