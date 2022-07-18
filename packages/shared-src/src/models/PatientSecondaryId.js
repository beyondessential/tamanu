import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { PatientLinkedModel } from './PatientLinkedModel';

export class PatientSecondaryId extends PatientLinkedModel {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        value: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'typeId',
      as: 'type',
    });
  }
}
