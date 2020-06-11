import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class PatientCondition extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
        resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'Condition' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
  }

  static getListReferenceAssociations() {
    return ['Condition'];
  }

  forResponse() {
    const { Condition, ...data } = super.forResponse();
    return { ...data, condition: Condition.forResponse() };
  }
}
