import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
    console.log('running')
  await query.renameColumn('lab_test_types', 'question_type', 'result_type');
  await query.sequelize.query(`
  ALTER TYPE enum_lab_test_types_question_type ADD VALUE 'Select'
  ALTER TYPE enum_lab_test_types_question_type RENAME VALUE 'string' TO 'FreeText'
  ALTER TYPE enum_lab_test_types_question_type RENAME VALUE 'number' TO 'Number'
  ALTER TYPE enum_lab_test_types_question_type RENAME TO enum_lab_test_types_result_type
  `);
}

export async function down(query: QueryInterface) {
  // await query.renameColumn('lab_test_types', 'result_type', 'question_type');
  // await query.sequelize.query(` 
  //   ALTER TYPE enum_lab_test_types_question_type DROP VALUE 'Select'
  //   ALTER TYPE enum_lab_test_types_question_type RENAME VALUE 'FreeText' TO 'string'
  //   ALTER TYPE enum_lab_test_types_question_type RENAME VALUE 'Number' TO 'number'
  //   `);
}
