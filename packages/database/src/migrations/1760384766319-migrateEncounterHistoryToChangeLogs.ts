import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // TODO: Migrate encounter_history data to logs.changes table
  // 1. Query all encounter_history records
  // 2. Transform each record to logs.changes format:
  //    - table_name: 'encounters'
  //    - record_id: encounterId from encounter_history
  //    - record_data: JSONB containing the encounter state at that point in time
  //    - logged_at: date from encounter_history
  //    - updated_by_user_id: actorId from encounter_history
  //    - reason: changeType from encounter_history (e.g., 'encounter_type', 'location', 'department', 'examiner')
  // 3. Insert transformed records into logs.changes
  // 4. Handle any data validation or cleanup needed
  
  // TODO: After data migration is complete, drop the encounter_history table
  // await query.dropTable('encounter_history');
  
  /**
   * Have you handled the state of the sync_lookup table after running this migration?
   * You can add the following query to rebuild the lookup table for the tables you have modified:
   */
  // await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('<table_name>');`);
  
  // Note: On larger tables this may have a performance impact that should be considered.
}

export async function down(query: QueryInterface): Promise<void> {
  // TODO: Reverse migration - remove encounter_history data from logs.changes
  // 1. Delete records from logs.changes where table_name = 'encounters' and reason matches encounter change types
  // 2. Consider if we need to restore encounter_history table structure
  // 3. Handle any cleanup needed
  
  // TODO: If encounter_history table was dropped, recreate it
  // await query.createTable('encounter_history', { ... });
}
