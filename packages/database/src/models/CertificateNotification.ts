import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

import { dateType, type InitOptions, type Models } from '../types/model';

export class CertificateNotification extends Model {
  declare id: string;
  declare createdBy?: string;
  declare type?: string;
  declare facilityName?: string;
  declare forwardAddress?: string;

  declare status?: string;
  declare error?: string;
  declare language?: string;
  declare printedDate?: string;
  declare patientId?: string;
  declare labTestId?: string;
  declare labRequestId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        createdBy: DataTypes.STRING,
        type: DataTypes.STRING,
        facilityName: DataTypes.STRING,
        forwardAddress: DataTypes.STRING,

        status: DataTypes.STRING,
        error: DataTypes.TEXT,
        language: DataTypes.STRING,
        printedDate: dateType('printedDate'),
      },
      {
        ...options,

        // Note that if this changes to bidirectional, the SendCertificateNotification task
        // will need to be updated / limited to handle only new publishes!
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
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
