import { Sequelize } from 'sequelize';
import { endOfDay, isBefore, parseISO, startOfToday } from 'date-fns';

import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_VALUES, NOTE_TYPES, SYNC_DIRECTIONS } from '../constants';
import { InvalidOperationError } from '../errors';
import { dateTimeType } from './dateTimeTypes';

import { Model } from './Model';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';
import { dischargeOutpatientEncounters } from '../utils/dischargeOutpatientEncounters';
import { getCurrentDateTimeString } from '../utils/dateTime';

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
        plannedLocationStartTime: dateTimeType('plannedLocationStartTime'),
      },
      {
        ...options,
        validate,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
    onSaveMarkPatientForSync(this);
  }

  static getFullReferenceAssociations() {
    return [
      'department',
      'examiner',
      {
        association: 'location',
        include: ['facility', 'locationGroup'],
      },
      {
        association: 'plannedLocation',
        include: ['facility', 'locationGroup'],
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

    this.belongsTo(models.Location, {
      foreignKey: 'plannedLocationId',
      as: 'plannedLocation',
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

    this.hasMany(models.LabTestPanelRequest, {
      foreignKey: 'encounterId',
      as: 'labTestPanelRequests',
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
    const encountersToIncludeClauses = [];
    const updatedAtSyncTickClauses = ['encounters.updated_at_sync_tick > :since'];

    if (patientIds.length > 0) {
      encountersToIncludeClauses.push('encounters.patient_id IN (:patientIds)');
    }

    // add any encounters with a lab request, if syncing all labs is turned on for facility server
    if (syncAllLabRequests) {
      joins.push(`
        LEFT JOIN (
          SELECT e.id, max(lr.updated_at_sync_tick) as lr_updated_at_sync_tick
          FROM encounters e
          INNER JOIN lab_requests lr ON lr.encounter_id = e.id
          WHERE e.updated_at_sync_tick > :since
          OR lr.updated_at_sync_tick > :since
          ${
            patientIds.length > 0
              ? 'AND e.patient_id NOT IN (:patientIds) -- no need to sync if it would be synced anyway'
              : ''
          }
          GROUP BY e.id
        ) AS encounters_with_labs ON encounters_with_labs.id = encounters.id
      `);

      encountersToIncludeClauses.push(`
        encounters_with_labs.id IS NOT NULL
      `);

      updatedAtSyncTickClauses.push(`
        encounters_with_labs.lr_updated_at_sync_tick > :since
      `);
    }

    // for mobile, add any encounters with a vaccine in the list of scheduled vaccines that sync everywhere
    if (syncAllEncountersForTheseVaccines?.length > 0) {
      const escapedVaccineIds = syncAllEncountersForTheseVaccines
        .map(id => this.sequelize.escape(id))
        .join(',');
      joins.push(`
        LEFT JOIN (
          SELECT e.id, MAX(av.updated_at_sync_tick) AS av_updated_at_sync_tick
          FROM encounters e
          INNER JOIN administered_vaccines av ON av.encounter_id = e.id
          INNER JOIN scheduled_vaccines sv ON sv.id = av.scheduled_vaccine_id
          WHERE
            sv.vaccine_id IN (${escapedVaccineIds})
          AND
            (
              e.updated_at_sync_tick > :since
            OR
              av.updated_at_sync_tick > :since
            )
          ${
            patientIds.length > 0
              ? 'AND e.patient_id NOT IN (:patientIds) -- no need to sync if it would be synced anyway'
              : ''
          }
          GROUP BY e.id
        ) AS encounters_with_scheduled_vaccines
        ON encounters_with_scheduled_vaccines.id = encounters.id
      `);

      encountersToIncludeClauses.push(`
        encounters_with_scheduled_vaccines.id IS NOT NULL
      `);

      updatedAtSyncTickClauses.push(`
        encounters_with_scheduled_vaccines.av_updated_at_sync_tick > :since
      `);
    }

    if (encountersToIncludeClauses.length === 0) {
      return null;
    }

    return `
      ${joins.join('\n')}
      WHERE (
        ${encountersToIncludeClauses.join('\nOR')}
      )
      AND (
        ${updatedAtSyncTickClauses.join('\nOR')}
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

  static async adjustDataPostSyncPush(recordIds) {
    await dischargeOutpatientEncounters(this.sequelize.models, recordIds);
  }

  static async create(...args) {
    const { EncounterHistory } = this.sequelize.models;
    const encounter = await super.create(...args);
    await EncounterHistory.createSnapshot(encounter, getCurrentDateTimeString());

    return encounter;
  }

  async addLocationChangeNote(contentPrefix, newLocationId, submittedTime, user) {
    const { Location } = this.sequelize.models;
    const oldLocation = await Location.findOne({
      where: { id: this.locationId },
      include: 'locationGroup',
    });
    const newLocation = await Location.findOne({
      where: { id: newLocationId },
      include: 'locationGroup',
    });
    if (!newLocation) {
      throw new InvalidOperationError('Invalid location specified');
    }

    await this.addSystemNote(
      `${contentPrefix} from ${Location.formatFullLocationName(
        oldLocation,
      )} to ${Location.formatFullLocationName(newLocation)}`,
      submittedTime,
      user,
    );
  }

  async addDepartmentChangeNote(toDepartmentId, submittedTime, user) {
    const { Department } = this.sequelize.models;
    const oldDepartment = await Department.findOne({ where: { id: this.departmentId } });
    const newDepartment = await Department.findOne({ where: { id: toDepartmentId } });
    if (!newDepartment) {
      throw new InvalidOperationError('Invalid department specified');
    }
    await this.addSystemNote(
      `Changed department from ${oldDepartment.name} to ${newDepartment.name}`,
      submittedTime,
      user,
    );
  }

  async addSystemNote(content, date, user) {
    const notePage = await this.createNotePage({
      noteType: NOTE_TYPES.SYSTEM,
      date,
    });
    await notePage.createNoteItem({
      content,
      date,
      ...(user?.id && { authorId: user?.id }),
    });
  }

  async getLinkedTriage() {
    const { Triage } = this.sequelize.models;
    return Triage.findOne({
      where: {
        encounterId: this.id,
      },
    });
  }

  async onDischarge({ endDate, submittedTime, systemNote, discharge }, user) {
    const { Discharge } = this.sequelize.models;
    await Discharge.create({
      ...discharge,
      encounterId: this.id,
    });

    await this.addSystemNote(systemNote || 'Discharged patient.', submittedTime, user);
    await this.closeTriage(endDate);
  }

  async onEncounterProgression(newEncounterType, submittedTime, user) {
    await this.addSystemNote(
      `Changed type from ${this.encounterType} to ${newEncounterType}`,
      submittedTime,
      user,
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

  async updateClinician(newClinicianId, submittedTime, user) {
    const { User } = this.sequelize.models;
    const oldClinician = await User.findOne({ where: { id: this.examinerId } });
    const newClinician = await User.findOne({ where: { id: newClinicianId } });

    if (!newClinician) {
      throw new InvalidOperationError('Invalid clinician specified');
    }

    await this.addSystemNote(
      `Changed supervising clinician from ${oldClinician.displayName} to ${newClinician.displayName}`,
      submittedTime,
      user,
    );
  }

  async update(data, user) {
    const { Location, EncounterHistory } = this.sequelize.models;

    const updateEncounter = async () => {
      const additionalChanges = {};
      if (data.endDate && !this.endDate) {
        await this.onDischarge(data, user);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("An encounter's patient cannot be changed");
      }

      const isEncounterTypeChanged =
        data.encounterType && data.encounterType !== this.encounterType;
      if (isEncounterTypeChanged) {
        await this.onEncounterProgression(data.encounterType, data.submittedTime, user);
      }

      const isLocationChanged = data.locationId && data.locationId !== this.locationId;
      if (isLocationChanged) {
        await this.addLocationChangeNote(
          'Changed location',
          data.locationId,
          data.submittedTime,
          user,
        );

        // When we move to a new location, clear the planned location move
        additionalChanges.plannedLocationId = null;
        additionalChanges.plannedLocationStartTime = null;
      }

      if (data.plannedLocationId === null) {
        // The automatic timeout doesn't provide a submittedTime, prevents double noting a cancellation
        if (this.plannedLocationId && data.submittedTime) {
          const currentlyPlannedLocation = await Location.findOne({
            where: { id: this.plannedLocationId },
          });
          await this.addSystemNote(
            `Cancelled planned move to ${currentlyPlannedLocation.name}`,
            data.submittedTime,
            user,
          );
        }
        additionalChanges.plannedLocationStartTime = null;
      }

      if (data.plannedLocationId && data.plannedLocationId !== this.plannedLocationId) {
        if (data.plannedLocationId === this.locationId) {
          throw new InvalidOperationError(
            'Planned location cannot be the same as current location',
          );
        }

        await this.addLocationChangeNote(
          'Added a planned location change',
          data.plannedLocationId,
          data.submittedTime,
          user,
        );

        additionalChanges.plannedLocationStartTime = data.submittedTime;
      }

      const isDepartmentChanged = data.departmentId && data.departmentId !== this.departmentId;
      if (isDepartmentChanged) {
        await this.addDepartmentChangeNote(data.departmentId, data.submittedTime, user);
      }

      const isClinicianChanged = data.examinerId && data.examinerId !== this.examinerId;
      if (isClinicianChanged) {
        await this.updateClinician(data.examinerId, data.submittedTime, user);
      }

      if (
        isEncounterTypeChanged ||
        isDepartmentChanged ||
        isLocationChanged ||
        isClinicianChanged
      ) {
        const newEncounter = {
          id: this.id,
          encounterType: this.encounterType,
          locationId: this.locationId,
          departmentId: this.departmentId,
          examinerId: this.examinerId,
          ...data,
        };
        await EncounterHistory.createSnapshot(newEncounter, data.submittedTime);
      }

      const { submittedTime, ...encounterData } = data;
      return super.update({ ...encounterData, ...additionalChanges }, user);
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
