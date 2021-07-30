import config from 'config';

import { ScheduledTask } from 'shared/tasks';
import { log } from 'shared/services/logging';

const KEYS_TO_IGNORE = [
  'id',
  'updatedAt', 
  'createdAt', 
  'deletedAt', 
  'pushedAt',
  'pulledAt', 
  'markedForPush',
];

export class AdditionalDataReconciler extends ScheduledTask {

  constructor(context) {
    super('0 */5 * * * *', log);
    this.context = context;
    this.runImmediately();
  }

  getName() {
    return 'AdditionalDataReconciler';
  }

  async reconcilePatient(patientId) {
    const { models, sequelize } = this.context.store;
    
    const records = await models.PatientAdditionalData.findAll({
      where: {
        patientId
      },
      order: [['createdAt', 'ASC NULLS FIRST']],
    });

    const [primary, ...subsequent] = records;

    // save values of later records to primary record
    const conflicts = [];
    let didExtend = false;
    const extend = record => {
      Object.entries(record.dataValues)
        .map(([key, value]) => {
          if (KEYS_TO_IGNORE.includes(key)) return;
          if (value === null) return; // always ignore incoming nulls
          const existingValue = primary[key];
          if (value === existingValue) return; // no difference = no write

          didExtend = true;

          if (existingValue !== null) {
            // writing over a non-null with a non-null, log it against the record
            conflicts.push({ 
              key,
              newValue: value, 
              oldValue: existingValue,
              date: new Date(),
            });
          }
          primary[key] = value;
        });
    }
    subsequent.map(r => extend(r));

    await sequelize.transaction(async () => {
      primary.appendConflictRecords(conflicts);
      await primary.save();

      // delete all duplicates
      for (let sub of subsequent) {
        await models.PatientAdditionalData.markRecordDeleted(sub.id);
      }

      log.info(`[AdditionalDataReconciler] Reconciled ${subsequent.length} duplicate PADs for ${primary.patientId}`);
    });
  }

  async run() {
    // query for duplicate PAD items
    const { sequelize } = this.context.store;
    const [duplicateResults] = await sequelize.query(`
      SELECT 
        patient_id, COUNT(*) 
      FROM 
        patient_additional_data 
      WHERE
        patient_additional_data.deleted_at IS NULL
      GROUP BY patient_id 
      HAVING COUNT(*) > 1;
    `);

    // reconcile each duplicated PAD item 
    for (let r of duplicateResults) {
      await this.reconcilePatient(r.patient_id);
    }
  }
}
