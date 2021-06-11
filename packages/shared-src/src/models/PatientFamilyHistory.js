import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { extendClassWithPatientChannel } from './sync';
import { Model } from './Model';

export class PatientFamilyHistory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, allowNull: false },
        relationship: Sequelize.STRING,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    this.belongsTo(models.User, { foreignKey: 'practitionerId', as: 'practitioner' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'diagnosisId', as: 'diagnosis' });
  }

  static getListReferenceAssociations() {
    return ['diagnosis'];
  }

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  static channelRoutes = ['patient/:patientId/familyHistory'];
}

extendClassWithPatientChannel(PatientFamilyHistory, 'familyHistory');
