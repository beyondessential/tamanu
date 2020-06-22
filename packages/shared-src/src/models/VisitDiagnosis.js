import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class VisitDiagnosis extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        certainty: {
          type: Sequelize.ENUM('suspected', 'confirmed'),
          defaultValue: 'suspected',
        },
        isPrimary: Sequelize.BOOLEAN,
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

  static getListReferenceAssociations() {
    return ['Diagnosis'];
  }
}
