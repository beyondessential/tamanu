import { Sequelize, Model } from 'sequelize';
import { AVPU_OPTIONS } from 'shared/constants';

export class VisitDiagnosis extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        ...options,
        validate: {
          mustHaveDiagnosis() {
            if (!this.diagnosisId) {
              throw new Error('A visit diagnosis must be attached to a diagnosis.');
            }
          },
          mustHaveVisit() {
            if (!this.visitId) {
              throw new Error('A visit diagnosis must be attached to a visit.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Visit, {
      foreignKey: 'visitId',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'diagnosisId',
      as: 'Diagnosis',
    });
  }

  static getEagerAssociations(models) {
    return [{
      model: models.ReferenceData,
      as: 'Diagnosis',
    }];
  }
}
