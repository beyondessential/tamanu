import { QueryInterface, ENUM, STRING } from 'sequelize';

const PREVIOUS_ENUM_VALUES = {
  NUMBER: 'number',
  STRING: 'string',
};

const CORRECTED_VALUES = {
  NUMBER: 'Number',
  FREE_TEXT: 'FreeText',
  SELECT: 'Select',
};

export async function up(query: QueryInterface) {
  await query.changeColumn('lab_test_types', 'question_type', {
    type: STRING,
    allowNull: false,
  });
  await query.sequelize.query('DROP TYPE IF EXISTS "enum_lab_test_types_question_type";');
  await query.renameColumn('lab_test_types', 'question_type', 'result_type');
  // Correct the type values
  await query.sequelize.query(
    `UPDATE lab_test_types SET result_type = CASE result_type 
     WHEN '${PREVIOUS_ENUM_VALUES.NUMBER}' THEN '${CORRECTED_VALUES.NUMBER}' 
     WHEN '${PREVIOUS_ENUM_VALUES.STRING}' THEN '${CORRECTED_VALUES.FREE_TEXT}'
     END
    `,
  );
}

export async function down(query: QueryInterface) {
  await query.sequelize.query(
    `UPDATE lab_test_types SET result_type = CASE result_type 
     WHEN '${CORRECTED_VALUES.NUMBER}' THEN '${PREVIOUS_ENUM_VALUES.NUMBER}' 
     WHEN '${CORRECTED_VALUES.FREE_TEXT}' THEN '${PREVIOUS_ENUM_VALUES.STRING}'
     END
    `,
  );
  await query.renameColumn('lab_test_types', 'result_type', 'question_type');
  await query.changeColumn('lab_test_types', 'question_type', {
    type: ENUM(...Object.values(PREVIOUS_ENUM_VALUES)),
    allowNull: false,
  });
}
