import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

import { dateType, type InitOptions, type Models } from '../types/model';

export class CertificateNotification extends Model {
  id!: string;
  createdBy?: string;
  type?: string;
  facilityName?: string;
  forwardAddress?: string;
  requireSigning?: boolean;
  status?: string;
  error?: string;
  language?: string;
  printedDate?: string;
  patientId?: string;
  labTestId?: string;
  labRequestId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        createdBy: DataTypes.STRING,
        type: DataTypes.STRING,
        facilityName: DataTypes.STRING,
        forwardAddress: DataTypes.STRING,
        requireSigning: DataTypes.BOOLEAN,
        status: DataTypes.STRING,
        error: DataTypes.TEXT,
        language: DataTypes.STRING,
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

  static initRelations(models: Models) {
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
