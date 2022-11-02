import { Sequelize } from 'sequelize';
import { endOfDay, isBefore, parseISO, startOfToday } from 'date-fns';

import {
  ENCOUNTER_TYPES,
  ENCOUNTER_TYPE_VALUES,
  NOTE_TYPES,
  SYNC_DIRECTIONS,
} from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { dateTimeType } from './dateTimeTypes';

import { Model } from './Model';

export class Encounter extends Model {
  static init({ primaryKey, hackToSkipEncounterValidation, ...options }) {
    let validate = {};
    if (!hackToSkipEncounterValidation) {
      validate = {
        mustHaveValidEncounterType() {
          if (!this.deletedAt && !ENCOUNTER_TYPE_VALUES.includes(this.encounterType)) {
            throw new InvalidOperationError('An encounter must have a valid encounter type.');
          }
        },
        mustHavePatient() {
          if (!this.deletedAt && !this.patientId) {
            throw new InvalidOperationError('An encounter must have a patient.');
          }
        },
        mustHaveDepartment() {
          if (!this.deletedAt && !this.departmentId) {
            throw new InvalidOperationError('An encounter must have a department.');
          }
        },
        mustHaveLocation() {
          if (!this.deletedAt && !this.locationId) {
            throw new InvalidOperationError('An encounter must have a location.');
          }
        },
        mustHaveExaminer() {
          if (!this.deletedAt && !this.examinerId) {
            throw new InvalidOperationError('An encounter must have an examiner.');
          }
        },
      };
    }
    super.init(
      {
        id: primaryKey,
        encounterType: Sequelize.STRING(31),
        startDate: dateTimeType('startDate', {
          allowNull: false,
        }),
        endDate: dateTimeType('endDate'),
        reasonForEncounter: Sequelize.TEXT,
        deviceId: Sequelize.TEXT,
      },
      {
        ...options,
        validate,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static getFullReferenceAssociations() {
    return [
      'department',
      'examiner',
      {
        association: 'location',
        include: ['facility'],
      },
      'referralSource',
    ];
  }

  static initRelations(models) {
    this.hasOne(models.Discharge, {
      foreignKey: 'encounterId',
      as: 'discharge',
    });

    this.hasOne(models.Invoice, {
      foreignKey: 'encounterId',
      as: 'invoice',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'examinerId',
      as: 'examiner',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });

    this.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
    });

    this.hasMany(models.SurveyResponse, {
      foreignKey: 'encounterId',
      as: 'surveyResponses',
    });

    this.hasMany(models.Referral, {
      foreignKey: 'initiatingEncounterId',
      as: 'initiatedReferrals',
    });
    this.hasMany(models.Referral, {
      foreignKey: 'completingEncounterId',
      as: 'completedReferrals',
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

    this.hasMany(models.LabRequest, {
      foreignKey: 'encounterId',
      as: 'labRequests',
    });

    this.hasMany(models.ImagingRequest, {
      foreignKey: 'encounterId',
      as: 'imagingRequests',
    });

    this.hasMany(models.Procedure, {
      foreignKey: 'encounterId',
      as: 'procedures',
    });

    this.hasMany(models.Vitals, {
      foreignKey: 'encounterId',
      as: 'vitals',
    });

    this.hasMany(models.Triage, {
      foreignKey: 'encounterId',
      as: 'triages',
    });

    this.hasMany(models.DocumentMetadata, {
      foreignKey: 'encounterId',
      as: 'documents',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'patientBillingTypeId',
      as: 'patientBillingType',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referralSourceId',
      as: 'referralSource',
    });

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });

    // this.hasMany(models.Procedure);
    // this.hasMany(models.Report);
  }

  static buildSyncFilter(patientIds, sessionConfig) {
    const { syncAllLabRequests, syncAllEncountersForTheseVaccines } = sessionConfig;
    const joins = [];
    const wheres = [];

    if (patientIds.length > 0) {
      wheres.push('encounters.patient_id IN (:patientIds)');
    }

    // add any encounters with a lab request, if syncing all labs is turned on for facility server
    if (syncAllLabRequests) {
      joins.push(`
        LEFT JOIN (
          SELECT DISTINCT e.id
          FROM encounters e
          INNER JOIN lab_requests lr ON lr.encounter_id = e.id
          WHERE e.updated_at_sync_tick > :since
        ) AS encounters_with_labs ON encounters_with_labs.id = encounters.id
      `);

      wheres.push(`
        encounters_with_labs.id IS NOT NULL
      `);
    }

    // for mobile, add any encounters with a vaccine in the list of scheduled vaccines that sync everywhere
    if (syncAllEncountersForTheseVaccines?.length > 0) {
      const escapedVaccineIds = syncAllEncountersForTheseVaccines
        .map(id => this.sequelize.escape(id))
        .join(',');
      joins.push(`
        LEFT JOIN (
          SELECT DISTINCT e.id
          FROM encounters e
          INNER JOIN administered_vaccines av ON av.encounter_id = e.id
          INNER JOIN scheduled_vaccines sv ON sv.id = av.scheduled_vaccine_id
          WHERE sv.vaccine_id IN (${escapedVaccineIds})
          AND e.updated_at_sync_tick > :since
        ) AS encounters_with_scheduled_vaccines
        ON encounters_with_scheduled_vaccines.id = encounters.id
      `);
      wheres.push(`
        encounters_with_scheduled_vaccines.id IS NOT NULL
      `);
    }

    if (wheres.length === 0) {
      return null;
    }

    return `
      ${joins.join('\n')}
      WHERE (
        ${wheres.join('\nOR')}
      )
    `;
  }

  static checkNeedsAutoDischarge({ encounterType, startDate, endDate }) {
    return (
      encounterType === ENCOUNTER_TYPES.CLINIC &&
      isBefore(parseISO(startDate), startOfToday()) &&
      !endDate
    );
  }

  static getAutoDischargeEndDate({ startDate }) {
    return endOfDay(parseISO(startDate));
  }

  static sanitizeForCentralServer(values) {
    // if the encounter is for an outpatient and started before today, it should be closed
    if (this.checkNeedsAutoDischarge(values)) {
      return { ...values, endDate: this.getAutoDischargeEndDate(values) };
    }
    return values;
  }

  async addSystemNote(content, date) {
    const notePage = await this.createNotePage({
      noteType: NOTE_TYPES.SYSTEM,
      date,
    });
    await notePage.createNoteItem({ content, date });
  }

  async getLinkedTriage() {
    const { Triage } = this.sequelize.models;
    return Triage.findOne({
      where: {
        encounterId: this.id,
      },
    });
  }

  async onDischarge(endDate, submittedTime, note) {
    await this.addSystemNote(note || `Discharged patient.`, submittedTime);
    await this.closeTriage(endDate);
  }

  async onEncounterProgression(newEncounterType, submittedTime) {
    await this.addSystemNote(
      `Changed type from ${this.encounterType} to ${newEncounterType}`,
      submittedTime,
    );
    await this.closeTriage(submittedTime);
  }

  async closeTriage(endDate) {
    const triage = await this.getLinkedTriage();
    if (triage) {
      await triage.update({
        closedTime: endDate,
      });
    }
  }

  async dischargeWithDischarger(discharger, endDate) {
    if (this.endDate) throw new Error(`Encounter ${this.id} already discharged`);

    const { Discharge } = this.sequelize.models;
    await Discharge.create({
      encounterId: this.id,
      dischargerId: discharger.id,
    });
    await this.update({ endDate });
  }

  async updateClinician(data) {
    const { User } = this.sequelize.models;
    const oldClinician = await User.findOne({ where: { id: this.examinerId } });
    const newClinician = await User.findOne({ where: { id: data.examinerId } });

    if (!newClinician) {
      throw new InvalidOperationError('Invalid clinician specified');
    }

    await this.addSystemNote(
      `Changed supervising clinician from ${oldClinician.displayName} to ${newClinician.displayName}`,
      data.submittedTime,
    );
  }

  async update(data) {
    const { Department, Location } = this.sequelize.models;

    const updateEncounter = async () => {
      if (data.endDate && !this.endDate) {
        await this.onDischarge(data.endDate, data.submittedTime, data.dischargeNote);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("An encounter's patient cannot be changed");
      }

      if (data.encounterType && data.encounterType !== this.encounterType) {
        await this.onEncounterProgression(data.encounterType, data.submittedTime);
      }

      if (data.locationId && data.locationId !== this.locationId) {
        const oldLocation = await Location.findOne({ where: { id: this.locationId } });
        const newLocation = await Location.findOne({ where: { id: data.locationId } });
        if (!newLocation) {
          throw new InvalidOperationError('Invalid location specified');
        }
        await this.addSystemNote(
          `Changed location from ${oldLocation.name} to ${newLocation.name}`,
          data.submittedTime,
        );
      }

      if (data.departmentId && data.departmentId !== this.departmentId) {
        const oldDepartment = await Department.findOne({ where: { id: this.departmentId } });
        const newDepartment = await Department.findOne({ where: { id: data.departmentId } });
        if (!newDepartment) {
          throw new InvalidOperationError('Invalid department specified');
        }
        await this.addSystemNote(
          `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
          data.submittedTime,
        );
      }

      if (data.examinerId && data.examinerId !== this.examinerId) {
        await this.updateClinician(data);
      }

      const { submittedTime, ...encounterData } = data;
      return super.update(encounterData);
    };

    if (this.sequelize.isInsideTransaction()) {
      return updateEncounter();
    }

    // If the update is not already in a transaction, wrap it in one
    // Having nested transactions can cause bugs in postgres so only conditionally wrap
    return this.sequelize.transaction(async () => {
      await updateEncounter();
    });
  }
}
