import { Sequelize } from 'sequelize';
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_VALUES, NOTE_TYPES, SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { extendClassWithPatientChannel } from './sync';
import { Model } from './Model';

export class Encounter extends Model {
  static init({ primaryKey, hackToSkipEncounterValidation, ...options }) {
    let validate = {};
    if (!hackToSkipEncounterValidation) {
      validate = {
        mustHaveValidEncounterType() {
          if (!this.deletedAt && !ENCOUNTER_TYPE_VALUES.includes(this.encounterType)) {
            throw new InvalidOperationError('A encounter must have a valid encounter type.');
          }
        },
        mustHavePatient() {
          if (!this.deletedAt && !this.patientId) {
            throw new InvalidOperationError('A encounter must have a patient.');
          }
        },
        mustHaveDepartment() {
          if (!this.deletedAt && !this.departmentId) {
            throw new InvalidOperationError('A encounter must have a department.');
          }
        },
        mustHaveLocation() {
          if (!this.deletedAt && !this.locationId) {
            throw new InvalidOperationError('A encounter must have a location.');
          }
        },
        mustHaveExaminer() {
          if (!this.deletedAt && !this.examinerId) {
            throw new InvalidOperationError('A encounter must have an examiner.');
          }
        },
      };
    }
    super.init(
      {
        id: primaryKey,
        encounterType: Sequelize.STRING(31),

        startDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        endDate: Sequelize.DATE,

        reasonForEncounter: Sequelize.TEXT,

        deviceId: Sequelize.TEXT,
      },
      {
        ...options,
        validate,
      },
    );
  }

  static getFullReferenceAssociations() {
    return ['vitals', 'department', 'location', 'examiner'];
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'examinerId',
      as: 'examiner',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'departmentId',
      as: 'department',
    });

    this.hasMany(models.Vitals, { as: 'vitals' });

    this.hasMany(models.SurveyResponse, {
      foreignKey: 'encounterId',
      as: 'surveyResponses',
    });

    this.hasMany(models.AdministeredVaccine, {
      foreignKey: 'encounterId',
      as: 'administeredVaccines',
    });

    this.hasMany(models.EncounterDiagnosis, {
      foreignKey: 'encounterId',
      as: 'diagnoses',
    });

    this.hasMany(models.EncounterMedication, {
      foreignKey: 'encounterId',
      as: 'medications',
    });

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

  static includedSyncRelations = [
    'administeredVaccines',
    'surveyResponses',
    'surveyResponses.answers',
    'diagnoses',
    'medications',
  ];

  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;
}

Object.assign(Encounter, extendClassWithPatientChannel('encounter'));
