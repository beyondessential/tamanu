/* eslint camelcase: ["error", { allow: ["^specificUpdate_"] }] */

import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import { log } from '@tamanu/shared/services/logging';
import { NOTE_RECORD_TYPES } from '@tamanu/constants/notes';

import { QueryTypes } from 'sequelize';
import {
  mergePatientAdditionalData,
  mergePatientBirthData,
  mergePatientDeathData,
  mergePatientFieldValues,
  mergePatientProgramRegistrations,
  mergePortalUser,
  refreshMultiChildRecordsForSync,
  reconcilePatientFacilities,
  simpleUpdateModels,
  specificUpdateModels,
} from '../admin/patientMerge/mergePatient';

export class PatientMergeMaintainer extends ScheduledTask {
  getName() {
    return 'PatientMergeMaintainer';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.patientMergeMaintainer,
      ...overrideConfig,
    };
    const { schedule, jitterTime, enabled } = conf;
    super(schedule, log, jitterTime, enabled);
    this.config = conf;
    this.models = context.store.models;
    this.sequelize = context.store.sequelize;
  }

  checkModelsMissingSpecificUpdateCoverage() {
    return specificUpdateModels.filter((modelName) => {
      const method = this[`specificUpdate_${modelName}`];
      return !method;
    });
  }

  async mergeAllRecordsForModel(model, patientFieldName = 'patient_id', additionalWhere = '') {
    // Note that we're not doing any funky recursive stuff to find patients-that-have-been-merged
    // -into-patients-that-have-been-merged-into-patients, we just do one level of merge per run.
    // It's unlikely that a "patient merge chain" will get created within the space of a single
    // sync-and-remerge cycle, and even if one does slip through the cracks it'll get resolved in
    // the next pass anyway.

    const tableName = model.getTableName();
    // Note that this is an UPDATE query that we're getting some RETURNS values from,
    // rather than a traditional SELECT, so it requires a slightly different approach (hence
    // the array destructure, the first value of which would be the # of affected rows)
    const [, result] = await model.sequelize.query(`
      UPDATE ${tableName}
      SET ${patientFieldName} = patients.merged_into_id
      FROM patients 
      WHERE 
        patients.id = ${tableName}.${patientFieldName} 
        AND patients.merged_into_id IS NOT NULL
        ${additionalWhere}
      RETURNING ${tableName}.id;
    `);
    return result.rows;
  }

  async findPendingMergePatients(model) {
    const tableName = model.getTableName();
    return model.sequelize.query(
      `
      SELECT 
        patients.id as "mergedPatientId",
        patients.merged_into_id as "keepPatientId"
      FROM ${tableName}
      JOIN patients ON patients.id = ${tableName}.patient_id
      WHERE 
        patients.merged_into_id IS NOT NULL
        ;
    `,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
  }

  async updateDependentRecordsForResync(merges) {
    const encounters = merges['Encounter'] || [];
    await refreshMultiChildRecordsForSync(this.models.Encounter, encounters);

    // Patient Care Plans
    const patientCarePlans = merges['PatientCarePlan'] || [];
    await refreshMultiChildRecordsForSync(this.models.PatientCarePlan, patientCarePlans);

    // Patient Death Data
    const patientDeathDataRecords = merges['PatientDeathData'] || [];
    await refreshMultiChildRecordsForSync(this.models.PatientDeathData, patientDeathDataRecords);
  }

  async remergePatientRecords() {
    return this.sequelize.transaction(async () => {
      // set up an object for counting affected records
      const counts = {};
      const merges = {};
      const updateCounts = (name, records) => {
        const len = records && records.length;
        if (len) {
          counts[name] = len;
        }
      };
      const updateMerges = (name, records) => {
        if (records?.length) {
          merges[name] = records;
        }
      };

      // do all the simple model updates
      for (const modelName of simpleUpdateModels) {
        const model = this.models[modelName];
        const records = await this.mergeAllRecordsForModel(model);
        updateCounts(modelName, records);
        updateMerges(modelName, records);
      }

      // then the model updates that need specific updates:
      for (const modelName of specificUpdateModels) {
        const method = this[`specificUpdate_${modelName}`];
        if (method) {
          const records = await method.call(this);
          updateCounts(modelName, records);
          updateMerges(modelName, records);
        }
      }

      await this.updateDependentRecordsForResync(merges);

      return counts;
    });
  }

  async specificUpdate_Patient() {
    // No merge required here (it will either already be merged or won't need it),
    // The function is just included for completeness.
  }

  async specificUpdate_PatientAdditionalData() {
    // PAD records need to be reconciled after merging
    const { PatientAdditionalData } = this.models;
    const padMerges = await this.findPendingMergePatients(PatientAdditionalData);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of padMerges) {
      const mergedPad = await mergePatientAdditionalData(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      if (mergedPad) {
        records.push(mergedPad);
      }
    }
    return records;
  }

  async specificUpdate_PatientBirthData() {
    const { PatientBirthData } = this.models;
    const patientBirthDataMerges = await this.findPendingMergePatients(PatientBirthData);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of patientBirthDataMerges) {
      const mergedPatientBirthData = await mergePatientBirthData(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      if (mergedPatientBirthData) {
        records.push(mergedPatientBirthData);
      }
    }
    return records;
  }

  async specificUpdate_PatientDeathData() {
    const { PatientDeathData } = this.models;
    const patientDeathDataMerges = await this.findPendingMergePatients(PatientDeathData);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of patientDeathDataMerges) {
      const mergedPatientDeathData = await mergePatientDeathData(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      if (mergedPatientDeathData?.length) {
        records.push(...mergedPatientDeathData);
      }
    }
    return records;
  }

  async specificUpdate_PatientFieldValue() {
    const { PatientFieldValue } = this.models;
    const fieldValueMerges = await this.findPendingMergePatients(PatientFieldValue);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of fieldValueMerges) {
      const mergedFieldValues = await mergePatientFieldValues(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      records.push(...mergedFieldValues);
    }
    return records;
  }

  async specificUpdate_PatientFacility() {
    const { PatientFacility } = this.models;
    const facilityMerges = await this.findPendingMergePatients(PatientFacility);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of facilityMerges) {
      const facilities = await reconcilePatientFacilities(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      records.push(...facilities);
    }

    return records;
  }

  async specificUpdate_PatientProgramRegistration() {
    const { PatientProgramRegistration } = this.models;
    const patientProgramRegistrationMerges = await this.findPendingMergePatients(
      PatientProgramRegistration,
    );

    const records = [];
    for (const { keepPatientId, mergedPatientId } of patientProgramRegistrationMerges) {
      const mergedPatientProgramRegistrationData = await mergePatientProgramRegistrations(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      if (mergedPatientProgramRegistrationData) {
        records.push(mergedPatientProgramRegistrationData);
      }
    }
    return records;
  }

  async specificUpdate_Note() {
    // uses a different field + additional search criteria
    const noteRecords = await this.mergeAllRecordsForModel(
      this.models.Note,
      'record_id',
      `AND record_type = '${NOTE_RECORD_TYPES.PATIENT}'`,
    );
    return noteRecords;
  }

  async specificUpdate_PortalUser() {
    const { PortalUser } = this.models;
    const portalUserMerges = await this.findPendingMergePatients(PortalUser);

    const records = [];
    for (const { keepPatientId, mergedPatientId } of portalUserMerges) {
      const mergedPortalUser = await mergePortalUser(
        this.models,
        keepPatientId,
        mergedPatientId,
      );
      if (mergedPortalUser) {
        records.push(mergedPortalUser);
      }
    }
    return records;
  }

  async run() {
    const outcomes = await this.remergePatientRecords();
    log.info('PatientMergeMaintainer finished merging. Records affected:', outcomes);
  }
}
