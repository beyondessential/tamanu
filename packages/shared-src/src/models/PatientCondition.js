import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { PatientLinkedModel } from './PatientLinkedModel';

export class PatientCondition extends PatientLinkedModel {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
        resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'condition' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
  }

  static getListReferenceAssociations() {
    return ['condition'];
  }
}
