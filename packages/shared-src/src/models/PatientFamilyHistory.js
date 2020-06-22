import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class PatientFamilyHistory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'Condition' });
  }

  static getListReferenceAssociations() {
    return ['Condition'];
  }
}
