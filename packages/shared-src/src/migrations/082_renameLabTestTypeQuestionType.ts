import { QueryInterface, ENUM, STRING } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.changeColumn('lab_test_types', 'question_type', {
    type: STRING,
    allowNull: false,
    defaultValue: 'Number',
  });
  await query.sequelize.query('DROP TYPE IF EXISTS "enum_lab_test_types_question_type";');
  await query.renameColumn('lab_test_types', 'question_type', 'result_type');
  await query.sequelize.query(
    `UPDATE lab_test_types SET result_type = CASE result_type 
      WHEN 'number' THEN 'Number' 
      WHEN 'string' THEN 'FreeText'
      END; 
    `,
  );
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(
    `UPDATE lab_test_types SET result_type = CASE result_type 
      WHEN 'Number' THEN 'number' 
      WHEN 'FreeText' THEN 'string'
      END; 
    `,
  );
  await query.renameColumn('lab_test_types', 'result_type', 'question_type');
  await query.changeColumn('lab_test_types', 'question_type', {
    type: ENUM,
    values: ['number', 'string'],
    allowNull: false,
    defaultValue: 'number',
  });
}
