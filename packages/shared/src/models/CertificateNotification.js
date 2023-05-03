import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

import { dateType } from './dateTimeTypes';

export class CertificateNotification extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        createdBy: Sequelize.STRING,
        type: Sequelize.STRING,
        forwardAddress: Sequelize.STRING,
        requireSigning: Sequelize.BOOLEAN,
        status: Sequelize.STRING,
        error: Sequelize.TEXT,
        printedDate: dateType('printedDate'),
      },
      {
        ...options,

        // Note that if this changes to bidirectional, the SendCertificateNotification task
        // will need to be updated / limited to handle only new publishes!
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    // For test certificates only
    this.belongsTo(models.LabTest, {
      foreignKey: 'labTestId',
      as: 'labTest',
    });

    // For automated emails
    this.belongsTo(models.LabRequest, {
      foreignKey: 'labRequestId',
      as: 'labRequest',
    });
  }
}
