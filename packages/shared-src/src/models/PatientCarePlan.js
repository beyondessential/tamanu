import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class PatientCarePlan extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'diseaseId', as: 'disease' });
    this.belongsTo(models.User, { foreignKey: 'examinerId', as: 'examiner' });
  }

  static getListReferenceAssociations() {
    return ['disease', 'examiner'];
  }
}
