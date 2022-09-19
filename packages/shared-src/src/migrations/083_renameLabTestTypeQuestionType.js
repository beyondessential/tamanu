import { ENUM, STRING } from 'sequelize';

const PREVIOUS_ENUM_VALUES = {
  NUMBER: 'number',
  STRING: 'string',
};

const CORRECTED_VALUES = {
  NUMBER: 'Number',
  FREE_TEXT: 'FreeText',
  SELECT: 'Select',
};

const replacements = {
  previousEnumNumber: PREVIOUS_ENUM_VALUES.NUMBER,
  correctedNumber: CORRECTED_VALUES.NUMBER,
  previousEnumString: PREVIOUS_ENUM_VALUES.STRING,
  correctedString: CORRECTED_VALUES.FREE_TEXT,
};

export async function up(query) {
  await query.changeColumn('lab_test_types', 'question_type', {
    type: STRING,
    allowNull: false,
  });
  await query.sequelize.query('DROP TYPE IF EXISTS "enum_lab_test_types_question_type";');
  await query.renameColumn('lab_test_types', 'question_type', 'result_type');
  await query.sequelize.query(
    `UPDATE lab_test_types
    SET
      result_type = CASE result_type WHEN :previousEnumNumber THEN :correctedNumber WHEN :previousEnumString THEN :correctedString END,
      updated_at = now()::timestamptz(3)
    `,
    {
      replacements,
    },
  );
}

export async function down(query) {
  await query.sequelize.query(
    `UPDATE lab_test_types
    SET
      result_type = CASE result_type WHEN :correctedNumber THEN :previousEnumNumber WHEN :correctedString THEN :previousEnumString END,
      updated_at = now()::timestamptz(3)
    `,
    {
      replacements,
    },
  );
  await query.renameColumn('lab_test_types', 'result_type', 'question_type');
  await query.changeColumn('lab_test_types', 'question_type', {
    type: ENUM(...Object.values(PREVIOUS_ENUM_VALUES)),
    allowNull: false,
  });
}
