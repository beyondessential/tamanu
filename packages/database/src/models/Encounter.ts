import { Op, DataTypes } from 'sequelize';

import {
  ENCOUNTER_TYPE_VALUES,
  EncounterChangeType,
  NOTE_TYPES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
  TASK_DELETE_RECORDED_IN_ERROR_REASON_ID,
} from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { dischargeOutpatientEncounters } from '@tamanu/shared/utils/dischargeOutpatientEncounters';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Model } from './Model';
import { dateTimeType, type InitOptions, type ModelProperties, type Models } from '../types/model';
import type { Location } from './Location';
import type { Patient } from './Patient';
import type { Discharge } from './Discharge';
import { onCreateEncounterMarkPatientForSync } from '../utils/onCreateEncounterMarkPatientForSync';
import type { SessionConfig } from '../types/sync';
import type { User } from './User';
import { buildEncounterLinkedLookupSelect } from '../sync/buildEncounterLinkedLookupFilter';

export class Encounter extends Model {
  declare id: string;
  declare encounterType?: string;
  declare startDate: string;
  declare endDate?: string;
  declare reasonForEncounter?: string;
  declare deviceId?: string;
  declare plannedLocationStartTime?: string;
  declare patientId?: string;
  declare examinerId?: string;
  declare locationId?: string;
  declare plannedLocationId?: string;
  declare departmentId?: string;
  declare patientBillingTypeId?: string;
  declare referralSourceId?: string;

  declare location?: Location;
  declare patient?: Patient;
  declare discharge?: Discharge;
  declare dischargeDraft?: Record<string, any>;

  static initModel(
    { primaryKey, hackToSkipEncounterValidation, ...options }: InitOptions,
    models: Models,
  ) {
    let validate: InitOptions['validate'] = {};
    if (!hackToSkipEncounterValidation) {
      validate = {
        mustHaveValidEncounterType() {
          if (!this.deletedAt && !ENCOUNTER_TYPE_VALUES.includes(this.encounterType as string)) {
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
        encounterType: DataTypes.STRING(31),
        startDate: dateTimeType('startDate', {
          allowNull: false,
        }),
        endDate: dateTimeType('endDate'),
        reasonForEncounter: DataTypes.TEXT,
        deviceId: DataTypes.TEXT,
        plannedLocationStartTime: dateTimeType('plannedLocationStartTime'),
        dischargeDraft: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
      },
      {
        ...options,
        validate,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          async afterDestroy(encounter: Encounter, opts) {
            const deletionReason = await models.ReferenceData.findByPk(
              TASK_DELETE_RECORDED_IN_ERROR_REASON_ID,
            );

            // update endtime for all parent tasks of this encounter
            await models.Task.update(
              {
                endTime: getCurrentDateTimeString(),
                deletedReasonForSyncId: deletionReason?.id ?? null,
              },
              {
                where: {
                  encounterId: encounter.id,
                  parentTaskId: null,
                  frequencyValue: { [Op.not]: null },
                  frequencyUnit: { [Op.not]: null },
                },
                transaction: opts.transaction,
              },
            );

            // set deletion info for all tasks of this encounter
            await models.Task.update(
              {
                deletedByUserId: SYSTEM_USER_UUID,
                deletedReasonId: deletionReason?.id ?? null,
                deletedTime: getCurrentDateTimeString(),
              },
              { where: { encounterId: encounter.id }, transaction: opts.transaction },
            );

            // delete all tasks of this encounter
            await models.Task.destroy({
              where: { encounterId: encounter.id },
              transaction: opts.transaction,
              individualHooks: true,
            });

            /** clean up all notifications */
            await models.Notification.destroy({
              where: {
                metadata: {
                  [Op.contains]: { encounterId: encounter.id },
                },
              },
              transaction: opts.transaction,
              individualHooks: true,
            });
          },
          afterUpdate: async (encounter: Encounter, opts) => {
            if (encounter.endDate && !encounter.previous('endDate')) {
              await models.Task.onEncounterDischarged(encounter, opts?.transaction ?? undefined);
              await models.MedicationAdministrationRecord.removeInvalidMedicationAdministrationRecords(
                opts?.transaction,
              );
            }
          },
        },
      },
    );
    onCreateEncounterMarkPatientForSync(this);
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
      'diets',
    ];
  }

  static initRelations(models: Models) {
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

    this.belongsToMany(models.Prescription, {
      foreignKey: 'encounterId',
      as: 'medications',
      through: models.EncounterPrescription,
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

    this.hasMany(models.EncounterHistory, {
      foreignKey: 'encounterId',
      as: 'encounterHistories',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'patientBillingTypeId',
      as: 'patientBillingType',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'referralSourceId',
      as: 'referralSource',
    });

    this.belongsToMany(models.ReferenceData, {
      through: models.EncounterDiet,
      as: 'diets',
      foreignKey: 'encounterId',
    });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });

    this.hasMany(models.EncounterHistory, {
      foreignKey: 'encounterId',
      as: 'encounterHistory',
    });

    this.hasMany(models.Appointment, {
      foreignKey: 'encounterId',
      as: 'appointments',
    });

    // this.hasMany(models.Procedure);
    // this.hasMany(models.Report);
  }

  static buildPatientSyncFilter(
    patientCount: number,
    markedForSyncPatientsTable: string,
    sessionConfig: SessionConfig,
  ) {
    const { syncAllLabRequests } = sessionConfig;
    const joins = [];
    const encountersToIncludeClauses = [];
    const updatedAtSyncTickClauses = ['encounters.updated_at_sync_tick > :since'];

    if (patientCount > 0) {
      encountersToIncludeClauses.push(
        `encounters.patient_id IN (SELECT patient_id FROM ${markedForSyncPatientsTable})`,
      );
    }

    // add any encounters with a lab request, if syncing all labs is turned on for facility server
    if (syncAllLabRequests) {
      joins.push(`
        LEFT JOIN (
          SELECT e.id, max(lr.updated_at_sync_tick) as lr_updated_at_sync_tick
          FROM encounters e
          INNER JOIN lab_requests lr ON lr.encounter_id = e.id
          WHERE (e.updated_at_sync_tick > :since OR lr.updated_at_sync_tick > :since)
          ${
            patientCount > 0
              ? `AND e.patient_id NOT IN (SELECT patient_id FROM ${markedForSyncPatientsTable}) -- no need to sync if it would be synced anyway`
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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterLinkedLookupSelect(this, {
        isLabRequestValue: 'new_labs.encounter_id IS NOT NULL',
      }),
      joins: `
        LEFT JOIN (
          SELECT DISTINCT encounter_id
          FROM lab_requests
          WHERE updated_at_sync_tick > :since -- to only include lab requests that recently got attached to the encounters
        ) AS new_labs ON new_labs.encounter_id = encounters.id
        LEFT JOIN locations ON encounters.location_id = locations.id
        LEFT JOIN facilities ON locations.facility_id = facilities.id
      `,
      where: `
        encounters.updated_at_sync_tick > :since -- to include including normal encounters
        OR
        new_labs.encounter_id IS NOT NULL -- to include encounters that got lab requests recently attached to it
      `,
    };
  }

  static async adjustDataPostSyncPush(recordIds: string[]) {
    await dischargeOutpatientEncounters(this.sequelize.models, recordIds);
  }

  static async create(...args: any): Promise<any> {
    const [data, options] = args;
    const { actorId, ...encounterData } = data;
    const encounter = (await super.create(encounterData, options)) as Encounter;

    const { EncounterHistory } = this.sequelize.models;
    await EncounterHistory.createSnapshot(
      encounter,
      {
        actorId: actorId || encounter.examinerId,
        submittedTime: encounter.startDate,
      },
      options,
    );

    return encounter;
  }

  async addLocationChangeNote(
    contentPrefix: string,
    newLocationId: string,
    submittedTime: string,
    user: ModelProperties<User>,
  ) {
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
        oldLocation!,
      )} to ${Location.formatFullLocationName(newLocation)}`,
      submittedTime,
      user,
    );
  }

  async addDepartmentChangeNote(
    toDepartmentId: string,
    submittedTime: string,
    user: ModelProperties<User>,
  ) {
    const { Department } = this.sequelize.models;
    const oldDepartment = await Department.findOne({ where: { id: this.departmentId } });
    const newDepartment = await Department.findOne({ where: { id: toDepartmentId } });
    if (!newDepartment) {
      throw new InvalidOperationError('Invalid department specified');
    }
    await this.addSystemNote(
      `Changed department from ${oldDepartment?.name} to ${newDepartment.name}`,
      submittedTime,
      user,
    );
  }

  async addTriageScoreNote(
    triageRecord: { score: any; triageTime: string },
    user: ModelProperties<User>,
  ) {
    const department = await this.sequelize.models.Department.findOne({
      where: { id: this.departmentId },
    });

    if (!department) {
      throw new InvalidOperationError(
        `Couldn’t record triage score as system note; no department found with with ID ‘${this.departmentId}’`,
      );
    }

    await this.addSystemNote(
      `${department.name} triage score: ${triageRecord.score}`,
      triageRecord.triageTime,
      user,
    );
  }

  async addSystemNote(content: string, date: string, user: ModelProperties<User>) {
    return (this as any).createNote({
      noteType: NOTE_TYPES.SYSTEM,
      date,
      content,
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

  async onDischarge(
    {
      endDate,
      submittedTime,
      systemNote,
      discharge,
    }: {
      endDate: string;
      submittedTime: string;
      systemNote?: string;
      discharge: ModelProperties<Discharge>;
    },
    user: ModelProperties<User>,
  ) {
    const { Discharge } = this.sequelize.models;
    await Discharge.create({
      ...discharge,
      encounterId: this.id,
    });

    await this.addSystemNote(systemNote || 'Discharged patient.', submittedTime, user);
    await this.closeTriage(endDate);
  }

  async onEncounterProgression(
    newEncounterType: Encounter['encounterType'],
    submittedTime: string,
    user: ModelProperties<User>,
  ) {
    await this.addSystemNote(
      `Changed type from ${this.encounterType} to ${newEncounterType}`,
      submittedTime,
      user,
    );
    await this.closeTriage(submittedTime);
  }

  async closeTriage(endDate: string) {
    const triage = await this.getLinkedTriage();
    if (!triage) return;
    if (triage.closedTime) return; // already closed

    await triage.update({
      closedTime: endDate,
    });
  }

  async updateClinician(
    newClinicianId: string,
    submittedTime: string,
    user: ModelProperties<User>,
  ) {
    const { User } = this.sequelize.models;
    const oldClinician = await User.findOne({ where: { id: this.examinerId } });
    const newClinician = await User.findOne({ where: { id: newClinicianId } });

    if (!newClinician) {
      throw new InvalidOperationError('Invalid clinician specified');
    }

    await this.addSystemNote(
      `Changed supervising clinician from ${oldClinician?.displayName} to ${newClinician.displayName}`,
      submittedTime,
      user,
    );
  }

  async update(...args: any): Promise<any> {
    const [data, user] = args;
    const { Location, EncounterHistory } = this.sequelize.models;
    let changeType: string | undefined;

    const updateEncounter = async () => {
      const additionalChanges: {
        plannedLocationId?: string | null;
        plannedLocationStartTime?: string | null;
      } = {};
      if (data.endDate && !this.endDate) {
        await this.onDischarge(data, user);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("An encounter's patient cannot be changed");
      }

      const isEncounterTypeChanged =
        data.encounterType && data.encounterType !== this.encounterType;
      if (isEncounterTypeChanged) {
        changeType = EncounterChangeType.EncounterType;
        await this.onEncounterProgression(data.encounterType, data.submittedTime, user);
      }

      const isLocationChanged = data.locationId && data.locationId !== this.locationId;
      if (isLocationChanged) {
        changeType = EncounterChangeType.Location;
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
            `Cancelled planned move to ${currentlyPlannedLocation?.name}`,
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
        changeType = EncounterChangeType.Department;
        await this.addDepartmentChangeNote(data.departmentId, data.submittedTime, user);
      }

      const isClinicianChanged = data.examinerId && data.examinerId !== this.examinerId;
      if (isClinicianChanged) {
        changeType = EncounterChangeType.Examiner;
        await this.updateClinician(data.examinerId, data.submittedTime, user);
      }

      const { submittedTime, ...encounterData } = data;
      const updatedEncounter = await super.update({ ...encounterData, ...additionalChanges }, user);

      const snapshotChanges = [
        isEncounterTypeChanged,
        isDepartmentChanged,
        isLocationChanged,
        isClinicianChanged,
      ].filter(Boolean);

      if (snapshotChanges.length > 1) {
        // Will revert all the changes above if error is thrown as this is in a transaction
        throw new InvalidOperationError(
          'Encounter type, department, location and clinician must be changed in separate operations',
        );
      }

      // multiple changes in 1 update transaction is not supported at the moment
      if (snapshotChanges.length === 1) {
        await EncounterHistory.createSnapshot(updatedEncounter, {
          actorId: user?.id,
          changeType,
          submittedTime,
        });
      }

      return updatedEncounter;
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
