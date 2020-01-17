import { Sequelize, Model } from 'sequelize';
import { VISIT_TYPES } from 'Shared/constants';

export class Visit extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        visitType: Sequelize.ENUM(Object.values(VISIT_TYPES)),

        startDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        endDate: Sequelize.DATE,

        reasonForVisit: Sequelize.TEXT,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      as: 'Examiner',
      foreignKey: 'examinerId',
    });

    // this.hasOne(models.Location);
    // this.hasOne(models.Department);

    // this.hasMany(models.Medication);
    // this.hasMany(models.Diagnosis);
    // this.hasMany(models.LabRequest);
    // this.hasMany(models.ImagingRequest);
    // this.hasMany(models.Note);
    // this.hasMany(models.Procedure);
    // this.hasMany(models.Vital);
    // this.hasMany(models.Report);
  }
}
