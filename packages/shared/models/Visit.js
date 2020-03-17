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
      },
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

  async addSystemNote(content) {
    const { Note } = this.sequelize.models;

    const note = await Note.createForObject(this, 'system', content);

    return note;
  }

  forResponse() {
    const data = super.forResponse();
    return {
      ...data,
    };
  }

  async update(data) {
    const { ReferenceData } = this.sequelize.models;

    if (data.endDate && !this.endDate) {
      await this.addSystemNote(`Discharged patient.`);
    }

    if (data.patientId && data.patientId !== this.patientId) {
      throw new Error("A visit's patient cannot be changed");
    }

    if (data.visitType && data.visitType !== this.visitType) {
      await this.addSystemNote(`Changed type from ${this.visitType} to ${data.visitType}`);
    }

    if (data.locationId && data.locationId !== this.locationId) {
      const oldLocation = await ReferenceData.findByPk(this.locationId);
      const newLocation = await ReferenceData.findByPk(data.locationId);
      if (!newLocation) {
        throw new Error('Invalid location specified');
      }
      await this.addSystemNote(`Changed location from ${oldLocation.name} to ${newLocation.name}`);
    }

    if (data.departmentId && data.departmentId !== this.departmentId) {
      const oldDepartment = await ReferenceData.findByPk(this.departmentId);
      const newDepartment = await ReferenceData.findByPk(data.departmentId);
      if (!newDepartment) {
        throw new Error('Invalid department specified');
      }
      await this.addSystemNote(
        `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
      );
    }

    return super.update(data);
  }
}
