import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';
import { NOTE_RECORD_TYPES } from 'shared/constants/notes';

import { simpleUpdateModels } from '../admin/patientMerge/mergePatient';

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
    const tableName = model.getTableName();
    const [, result] = await model.sequelize.query(`
      UPDATE ${tableName}
      SET ${patientFieldName} = patients.merged_into_id
      FROM patients 
      WHERE 
        patients.id = ${tableName}.${patientFieldName} 
        AND patients.merged_into_id IS NOT NULL
        ${additionalWhere}
      RETURNING patients.id;
    `);
    return result;
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
    const patientIdsToReconcile = await this.mergeAllRecordsForModel(PatientAdditionalData);
    for (const keepPatientId of patientIdsToReconcile) {
      await reconcilePatient(PatientAdditionalData.sequelize, keepPatientId);
    }
    updateOutcomes('PatientAdditionalData', patientIdsToReconcile);
    
    // - notePage: uses a different field + additional search criteria
    const noteRecords = await this.mergeAllRecordsForModel(
      this.models.NotePage,
      'record_id',
      `AND record_type = '${NOTE_RECORD_TYPES.PATIENT}'`
    );
    updateOutcomes('NotePage', noteRecords);

    return outcomes;
  }

  async run() {
    const outcomes = await this.remergePatientRecords();
    log.info("PatientMergeMaintainer finished merging. Records affected:", outcomes);
  }
}
