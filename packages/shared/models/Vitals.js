import { Sequelize, Model } from 'sequelize';
import { AVPU_OPTIONS } from 'Shared/constants';

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
        svo2: Sequelize.FLOAT,
        avpu: Sequelize.ENUM(AVPU_OPTIONS.map(x => x.value)),
      },
      {
        ...options,
        validate: {
          mustHaveVisit() {
            if(!this.visitId) {
              throw new Error("A vitals reading must be attached to a visit.");
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
              this.svo2,
              this.avpu,
            ];
            if(!allReadings.some(x => x)) {
              throw new Error("At least one reading must be defined");
            }
          }
        }
      }
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Visit, {
      foreignKey: 'visitId',
    });
  }
}
