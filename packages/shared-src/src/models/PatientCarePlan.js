import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'carePlanId', as: 'carePlan' });
    this.belongsTo(models.User, { foreignKey: 'examinerId', as: 'examiner' });

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static getListReferenceAssociations() {
    return ['carePlan', 'examiner'];
  }
}
