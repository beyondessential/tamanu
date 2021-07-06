import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { nestClassUnderPatientForSync } from './sync';
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
      {
        ...options,
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          channelRoutes: [
            {
              route: 'patient/:patientId/condition',
              params: [{ name: 'patientId' }],
            },
          ],
        },
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

nestClassUnderPatientForSync(PatientCondition, 'condition');
