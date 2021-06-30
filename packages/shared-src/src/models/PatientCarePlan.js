import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { nestClassUnderPatientForSync } from './sync';
import { Model } from './Model';

export class PatientCarePlan extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'carePlanId', as: 'carePlan' });
    this.belongsTo(models.User, { foreignKey: 'examinerId', as: 'examiner' });
  }

  static getListReferenceAssociations() {
    return ['carePlan', 'examiner'];
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  static channelRoutes = ['patient/:patientId/carePlan'];
}

nestClassUnderPatientForSync(PatientCarePlan, 'carePlan');
