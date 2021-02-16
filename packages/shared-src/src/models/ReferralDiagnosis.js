import { Model } from './Model';

export class ReferralDiagnosis extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        validate: {
          mustHaveDiagnosis() {
            if (!this.diagnosisId) {
              throw new Error('A referral diagnosis must be attached to a diagnosis.');
            }
          },
          mustHaveReferral() {
            if (!this.referralId) {
              throw new Error('A referral diagnosis must be attached to a referrral.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Referral, {
      foreignKey: 'referralId',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'diagnosisId',
      as: 'Diagnosis',
    });
  }

  static getListReferenceAssociations() {
    return ['Diagnosis'];
  }
}
