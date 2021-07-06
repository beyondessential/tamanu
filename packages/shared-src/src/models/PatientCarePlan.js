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
      {
        ...options,
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          channelRoutes: [
            {
              route: 'patient/:patientId/carePlan',
              params: [{ name: 'patientId' }],
            },
          ],
        },
      },
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
}

nestClassUnderPatientForSync(PatientCarePlan, 'carePlan');
