import { Sequelize } from 'sequelize';
import { VISIT_TYPES, NOTE_TYPES } from 'shared/constants';
import { InvalidOperationError } from 'lan/app/errors';
import { Model } from './Model';

const VISIT_TYPE_VALUES = Object.values(VISIT_TYPES);

export class Visit extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        visitType: Sequelize.ENUM(VISIT_TYPE_VALUES),

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
          mustHaveValidVisitType() {
            if (!VISIT_TYPE_VALUES.includes(this.visitType)) {
              throw new InvalidOperationError('A visit must have a valid visit type.');
            }
          },
          mustHavePatient() {
            if (!this.patientId) {
              throw new InvalidOperationError('A visit must have a patient.');
            }
          },
          mustHaveDepartment() {
            if (!this.departmentId) {
              throw new InvalidOperationError('A visit must have a department.');
            }
          },
          mustHaveLocation() {
            if (!this.locationId) {
              throw new InvalidOperationError('A visit must have a location.');
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

    const note = await Note.createForObject(this, NOTE_TYPES.SYSTEM, content);

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

    return this.sequelize.transaction(async () => {
      if (data.endDate && !this.endDate) {
        await this.addSystemNote(`Discharged patient.`);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("A visit's patient cannot be changed");
      }

      if (data.visitType && data.visitType !== this.visitType) {
        await this.addSystemNote(`Changed type from ${this.visitType} to ${data.visitType}`);
      }

      if (data.locationId && data.locationId !== this.locationId) {
        const oldLocation = await ReferenceData.findByPk(this.locationId);
        const newLocation = await ReferenceData.findByPk(data.locationId);
        if (!newLocation) {
          throw new InvalidOperationError('Invalid location specified');
        }
        await this.addSystemNote(
          `Changed location from ${oldLocation.name} to ${newLocation.name}`,
        );
      }

      if (data.departmentId && data.departmentId !== this.departmentId) {
        const oldDepartment = await ReferenceData.findByPk(this.departmentId);
        const newDepartment = await ReferenceData.findByPk(data.departmentId);
        if (!newDepartment) {
          throw new InvalidOperationError('Invalid department specified');
        }
        await this.addSystemNote(
          `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
        );
      }

      return super.update(data);
    });
  }
}
