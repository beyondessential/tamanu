import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class PatientIssue extends Model {

  static init({ primaryKey, ...options }) {
    super.init({
      id: primaryKey,
      note: Sequelize.STRING,
      recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      type: {
        type: Sequelize.ENUM('issue', 'warning'),
        defaultValue: 'issue',
        allowNull: false,
      },
    }, options);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', });
  }
}

