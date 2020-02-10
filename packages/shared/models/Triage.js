import { VISIT_TYPES } from 'shared/constants';
import { Sequelize } from 'sequelize';
import { Model } from './Model';

export class Triage extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        arrivalTime: Sequelize.DATE,
        triageTime: Sequelize.DATE,
        closedTime: Sequelize.DATE,

        score: Sequelize.TEXT,
        notes: Sequelize.TEXT,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      as: 'Practitioner',
      foreignKey: 'practitionerId',
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
