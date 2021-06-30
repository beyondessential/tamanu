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
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  static channelRoutes = ['patient/:patientId/issue'];
}

nestClassUnderPatientForSync(PatientIssue, 'issue');
