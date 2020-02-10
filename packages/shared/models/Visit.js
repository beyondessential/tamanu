import { Sequelize } from 'sequelize';
import { VISIT_TYPES } from 'shared/constants';
import { Model } from './Model';

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
      {
        ...options,
        validate: {
          mustHavePatient() {
            if (!this.patientId) {
              throw new Error('A visit must have a patient.');
            }
          },
          mustHaveDepartment() {
            if (!this.departmentId) {
              throw new Error('A visit must have a department.');
            }
          },
          mustHaveLocation() {
            if (!this.locationId) {
              throw new Error('A visit must have a location.');
            }
          },
        },
      }
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });

    this.belongsTo(models.User, {
      foreignKey: 'examinerId',
      as: 'Examiner',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'locationId',
      as: 'Location',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'departmentId',
      as: 'Department',
    });

    // this.hasMany(models.Medication);
    // this.hasMany(models.LabRequest);
    // this.hasMany(models.ImagingRequest);
    // this.hasMany(models.Note);
    // this.hasMany(models.Procedure);
    // this.hasMany(models.Vital);
    // this.hasMany(models.Report);
  }
}
