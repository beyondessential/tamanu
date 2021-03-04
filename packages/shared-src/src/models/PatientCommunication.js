import { Sequelize } from 'sequelize';
import {
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUSES_VALUES,
  PATIENT_COMMUNICATION_CHANNELS_VALUES,
  PATIENT_COMMUNICATION_TYPES_VALUES,
} from '../constants';

import { Model } from './Model';

export class PatientCommunication extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        type: { type: Sequelize.ENUM(PATIENT_COMMUNICATION_TYPES_VALUES), allowNull: false },
        channel: { type: Sequelize.ENUM(PATIENT_COMMUNICATION_CHANNELS_VALUES), allowNull: false },
        subject: Sequelize.TEXT,
        content: Sequelize.TEXT,
        status: {
          type: Sequelize.ENUM(COMMUNICATION_STATUSES_VALUES),
          allowNull: false,
          defaultValue: COMMUNICATION_STATUSES.QUEUED,
        },
        error: Sequelize.TEXT,
        retryCount: Sequelize.INTEGER,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }
}
