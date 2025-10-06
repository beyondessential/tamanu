import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // write your up migration here
  
  /**
   * Have you handled the state of the sync_lookup table after running this migration?
   * You can add the following query to rebuild the lookup table for the tables you have modified:
   */
  // await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('<table_name>');`);
  
  // Note: On larger tables this may have a performance impact that should be considered.
}

export async function down(query: QueryInterface): Promise<void> {
  // write your down migration here
}
