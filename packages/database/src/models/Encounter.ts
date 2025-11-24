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
import {
  dateTimeType,
  dateType,
  type InitOptions,
  type ModelProperties,
  type Models,
} from '../types/model';
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
  declare estimatedEndDate?: string;
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
        estimatedEndDate: dateType('estimatedEndDate'),
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

    this.hasMany(models.Appointment, {
      foreignKey: 'linkEncounterId',
      as: 'linkedAppointments',
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this, {
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
        // No change_type (NULL) for initial snapshots as these are treated differently in integration reports
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
    addSystemNoteRow: (content: string) => void,
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

    addSystemNoteRow(
      `${contentPrefix} from ‘${Location.formatFullLocationName(oldLocation!)}’ to ‘${Location.formatFullLocationName(newLocation)}’`,
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

  async closeTriage(endDate: string) {
    const triage = await this.getLinkedTriage();
    if (!triage) return;
    if (triage.closedTime) return; // already closed

    await triage.update({
      closedTime: endDate,
    });
  }

  async update(...args: any): Promise<any> {
    const [data, user] = args;
    const { Department, Location, EncounterHistory, ReferenceData, User } = this.sequelize.models;
    const changeTypes: string[] = [];

    const updateEncounter = async () => {
      const additionalChanges: {
        plannedLocationId?: string | null;
        plannedLocationStartTime?: string | null;
      } = {};

      const systemNoteRows: string[] = [];
      const addSystemNoteRow = (content: string) => systemNoteRows.push(content);

      const recordColumnChange = async ({
        columnName,
        fieldLabel,
        model,
        labelKey = 'name',
        changeType,
        onChange,
      }: {
        columnName: keyof Encounter;
        fieldLabel: string;
        model?: typeof Model;
        labelKey?: string;
        changeType?: EncounterChangeType;
        onChange?: () => Promise<void>;
      }) => {
        const isChanged = columnName in data && data[columnName] !== this[columnName];
        if (isChanged) {
          if (changeType) changeTypes.push(changeType);
          let oldValue: string;
          let newValue: string;
          if (model) {
            const oldRecord = await model.findByPk(this[columnName], { raw: true });
            const newRecord = await model.findByPk(data[columnName], { raw: true });
            oldValue = oldRecord?.[labelKey as keyof typeof oldRecord] ?? '-';
            newValue = newRecord?.[labelKey as keyof typeof newRecord] ?? '-';
          } else {
            oldValue = this[columnName] ?? '-';
            newValue = data[columnName] ?? '-';
          }
          addSystemNoteRow(`Changed ${fieldLabel} from ‘${oldValue}’ to ‘${newValue}’`);
          await onChange?.();
        }
      };

      if (data.endDate && !this.endDate) {
        await this.onDischarge(data, user);
      }

      if (data.patientId && data.patientId !== this.patientId) {
        throw new InvalidOperationError("An encounter's patient cannot be changed");
      }

      await recordColumnChange({
        columnName: 'encounterType',
        fieldLabel: 'encounter type',
        changeType: EncounterChangeType.EncounterType,
        onChange: async () => {
          await this.closeTriage(data.submittedTime);
        },
      });

      const isLocationChanged = data.locationId && data.locationId !== this.locationId;
      if (isLocationChanged) {
        changeTypes.push(EncounterChangeType.Location);
        await this.addLocationChangeNote('Changed location', data.locationId, addSystemNoteRow);

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
          addSystemNoteRow(`Cancelled planned move to ‘${currentlyPlannedLocation?.name}’`);
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
          addSystemNoteRow,
        );

        additionalChanges.plannedLocationStartTime = data.submittedTime;
      }

      await recordColumnChange({
        columnName: 'departmentId',
        fieldLabel: 'department',
        model: Department,
        changeType: EncounterChangeType.Department,
      });

      await recordColumnChange({
        columnName: 'examinerId',
        fieldLabel: 'supervising clinician',
        model: User,
        labelKey: 'displayName',
        changeType: EncounterChangeType.Examiner,
      });

      await recordColumnChange({
        columnName: 'startDate',
        fieldLabel: 'start date',
      });

      await recordColumnChange({
        columnName: 'patientBillingTypeId',
        fieldLabel: 'patient type',
        model: ReferenceData,
      });

      await recordColumnChange({
        columnName: 'referralSourceId',
        fieldLabel: 'referral source',
        model: ReferenceData,
      });

      await recordColumnChange({
        columnName: 'reasonForEncounter',
        fieldLabel: 'reason for encounter',
      });

      const { submittedTime, ...encounterData } = data;
      const updatedEncounter = await super.update({ ...encounterData, ...additionalChanges }, user);

      // Create snapshot with array of change types
      if (changeTypes.length > 0) {
        await EncounterHistory.createSnapshot(updatedEncounter, {
          actorId: user?.id,
          changeType: changeTypes,
          submittedTime,
        });
      }

      if (systemNoteRows.length > 0) {
        const formattedSystemNote = systemNoteRows.map(row => `• ${row}`).join('\n');
        await this.addSystemNote(
          formattedSystemNote,
          submittedTime || getCurrentDateTimeString(),
          user,
        );
      }

      return updatedEncounter;
    };

    if (this.sequelize.isInsideTransaction()) {
      return updateEncounter();
    }

    // If the update is not already in a transaction, wrap it in one
    // Having nested transactions can cause bugs in postgres so only conditionally wrap
    return this.sequelize.transaction(async () => {
      return await updateEncounter();
    });
  }
}
