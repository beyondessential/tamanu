import { Sequelize } from 'sequelize';
import { ENCOUNTER_TYPES, NOTE_TYPES } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

const ENCOUNTER_TYPE_VALUES = Object.values(ENCOUNTER_TYPES);

export class Encounter extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        encounterType: Sequelize.ENUM(ENCOUNTER_TYPE_VALUES),

        startDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        endDate: Sequelize.DATE,

        reasonForEncounter: Sequelize.TEXT,
      },
      {
        ...options,
        validate: {
          mustHaveValidEncounterType() {
            if (!ENCOUNTER_TYPE_VALUES.includes(this.encounterType)) {
              throw new InvalidOperationError('A encounter must have a valid encounter type.');
            }
          },
          mustHavePatient() {
            if (!this.patientId) {
              throw new InvalidOperationError('A encounter must have a patient.');
            }
          },
          mustHaveDepartment() {
            if (!this.departmentId) {
              throw new InvalidOperationError('A encounter must have a department.');
            }
          },
          mustHaveLocation() {
            if (!this.locationId) {
              throw new InvalidOperationError('A encounter must have a location.');
            }
          },
          mustHaveExaminer() {
            if (!this.examinerId) {
              throw new InvalidOperationError('A encounter must have an examiner.');
            }
          },
        },
      },
    );
  }

  static getFullReferenceAssociations() {
    return ['vitals', 'notes'];
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

    this.hasMany(models.Vitals, { as: 'vitals' });
    this.hasMany(models.Note, { as: 'notes', foreignKey: 'recordId' });

    // this.hasMany(models.Medication);
    // this.hasMany(models.LabRequest);
    // this.hasMany(models.ImagingRequest);
    // this.hasMany(models.Procedure);
    // this.hasMany(models.Report);
  }

  async addSystemNote(content) {
    const { Note } = this.sequelize.models;

    const note = await Note.createForRecord(this, NOTE_TYPES.SYSTEM, content);

    return note;
  }

  async getLinkedTriage() {
    const { Triage } = this.sequelize.models;
    return Triage.findOne({
      where: {
        encounterId: this.id,
      },
    });
  }

  async onDischarge(endDate, note) {
    await this.addSystemNote(note || `Discharged patient.`);
    await this.closeTriage(endDate);
  }

  async onEncounterProgression(newEncounterType) {
    await this.addSystemNote(`Changed type from ${this.encounterType} to ${newEncounterType}`);
    await this.closeTriage(new Date());
  }

  async closeTriage(endDate) {
    const triage = await this.getLinkedTriage();
    if (triage) {
      await triage.update({
        closedTime: endDate,
      });
    }
  }

  async update(data) {
    const { ReferenceData } = this.sequelize.models;

    return this.sequelize.transaction(async () => {
      if (data.endDate && !this.endDate) {
        await this.onDischarge(data.endDate, data.dischargeNote);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("A encounter's patient cannot be changed");
      }

      if (data.encounterType && data.encounterType !== this.encounterType) {
        await this.onEncounterProgression(data.encounterType);
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
