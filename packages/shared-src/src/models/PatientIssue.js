import { Sequelize } from 'sequelize';
import { nestClassUnderPatientForSync } from './sync';
import { Model } from './Model';
import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '../constants';

export class PatientIssue extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
        type: {
          type: Sequelize.ENUM(Object.values(PATIENT_ISSUE_TYPES)),
          defaultValue: PATIENT_ISSUE_TYPES.ISSUE,
          allowNull: false,
        },
      },
      {
        ...options,
        syncConfig: {
          syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
          channelRoutes: [
            {
              route: 'patient/:patientId/issue',
              params: [{ name: 'patientId' }],
            },
          ],
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }
}

nestClassUnderPatientForSync(PatientIssue, 'issue');
