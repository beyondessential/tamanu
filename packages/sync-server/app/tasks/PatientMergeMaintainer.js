import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { NOTE_RECORD_TYPES } from 'shared/constants/notes';

import { simpleUpdateModels } from '../admin/patientMerge/mergePatient';
import { reconcilePatient } from '../utils/removeDuplicatedPatientAdditionalData';

export class PatientMergeMaintainer extends ScheduledTask {
  getName() {
    return 'PatientMergeMaintainer';
  }

  constructor(context, overrideConfig = null) {
    const conf = {
      ...config.schedules.patientMergeMaintainer,
      ...overrideConfig,
    };
    super(conf.schedule, log);
    this.config = conf;
    this.models = context.store.models;
  }

  async mergeAllRecordsForModel(model, patientFieldName = 'patient_id', additionalWhere = '') {
    // Note that we're not doing any funky recursive stuff to find patients-that-have-been-merged
    // -into-patients-that-have-been-merged-into-patients, we just do one level of merge per run.
    // It's unlikely that a "patient merge chain" will get created within the space of a single
    // sync-and-remerge cycle, and even if one does slip through the cracks it'll get resolved in
    // the next pass anyway.

    const tableName = model.getTableName();
    const [, result] = await model.sequelize.query(`
      UPDATE ${tableName}
      SET ${patientFieldName} = patients.merged_into_id
      FROM patients 
      WHERE 
        patients.id = ${tableName}.${patientFieldName} 
        AND patients.merged_into_id IS NOT NULL
        ${additionalWhere}
      RETURNING patients.id, patients.merged_into_id;
    `);
    return result.rows;
  }

  async remergePatientRecords() {
    const outcomes = {};
    const updateOutcomes = (name, records) => {
      const len = records.length;
      if (len > 0) {
        outcomes[name] = len;
      }
    };

    // do all the simple model updates
    for (const modelName of simpleUpdateModels) {
      const model = this.models[modelName];
      const records = await this.mergeAllRecordsForModel(model);
      updateOutcomes(modelName, records);
    }

    // then the complex model updates:

    // - patient: no merge required here (it will either already be merged or won't need it)

    // - patientAdditionalData: needs reconcile
    const { PatientAdditionalData } = this.models;
    const patientRecordsToReconcile = await this.mergeAllRecordsForModel(PatientAdditionalData);
    for (const keepPatientRecord of patientRecordsToReconcile) {
      await reconcilePatient(PatientAdditionalData.sequelize, keepPatientRecord.merged_into_id);
    }
    updateOutcomes('PatientAdditionalData', patientRecordsToReconcile);

    // - notePage: uses a different field + additional search criteria
    const noteRecords = await this.mergeAllRecordsForModel(
      this.models.NotePage,
      'record_id',
      `AND record_type = '${NOTE_RECORD_TYPES.PATIENT}'`,
    );
    updateOutcomes('NotePage', noteRecords);

    return outcomes;
  }

  async run() {
    const outcomes = await this.remergePatientRecords();
    log.info('PatientMergeMaintainer finished merging. Records affected:', outcomes);
  }
}
