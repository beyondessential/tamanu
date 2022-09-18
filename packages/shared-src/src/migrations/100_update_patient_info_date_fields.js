import { DataTypes } from 'sequelize';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';
const PATIENT_ALLERGIES = 'patient_allergies';
const PATIENT_CARE_PLANS = 'patient_care_plans';
const PATIENT_FAMILY_HISTORIES = 'patient_family_histories';
const PATIENT_ISSUES = 'patient_issues';

export async function up(query) {
  // 1. Create legacy columns
  await query.addColumn(PATIENT_ALLERGIES, 'recorded_date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(PATIENT_CARE_PLANS, 'date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(PATIENT_FAMILY_HISTORIES, 'recorded_date_legacy', {
    type: DataTypes.DATE,
  });
  await query.addColumn(PATIENT_ISSUES, 'recorded_date_legacy', {
    type: DataTypes.DATE,
  });

  // 2. Copy data to legacy columns for backup
  await query.sequelize.query(`
    UPDATE ${PATIENT_ALLERGIES}
    SET
    recorded_date_legacy = recorded_date;
  `);
  await query.sequelize.query(`
    UPDATE ${PATIENT_CARE_PLANS}
    SET
    date_legacy = date;
  `);
  await query.sequelize.query(`
    UPDATE ${PATIENT_FAMILY_HISTORIES}
    SET
    recorded_date_legacy = recorded_date;
  `);
  await query.sequelize.query(`
    UPDATE ${PATIENT_ISSUES}
    SET
    recorded_date_legacy = recorded_date;
  `);

  // 3.Change column types from of original columns from date to string & convert data to string
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_ALLERGIES}
    ALTER COLUMN recorded_date TYPE date_time_string USING TO_CHAR(recorded_date, '${ISO9075_DATE_TIME_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_CARE_PLANS}
    ALTER COLUMN date TYPE date_time_string USING TO_CHAR(date, '${ISO9075_DATE_TIME_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_FAMILY_HISTORIES}
    ALTER COLUMN recorded_date TYPE date_time_string USING TO_CHAR(recorded_date, '${ISO9075_DATE_TIME_FMT}');
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_ISSUES}
    ALTER COLUMN recorded_date TYPE date_time_string USING TO_CHAR(recorded_date, '${ISO9075_DATE_TIME_FMT}');
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_ALLERGIES}
    ALTER COLUMN recorded_date TYPE timestamp with time zone USING recorded_date_legacy;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_CARE_PLANS}
    ALTER COLUMN date TYPE timestamp with time zone USING date_legacy;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_FAMILY_HISTORIES}
    ALTER COLUMN recorded_date TYPE timestamp with time zone USING recorded_date_legacy;
  `);
  await query.sequelize.query(`
    ALTER TABLE ${PATIENT_ISSUES}
    ALTER COLUMN recorded_date TYPE timestamp with time zone USING recorded_date_legacy;
  `);
  await query.removeColumn(PATIENT_ALLERGIES, 'recorded_date_legacy');
  await query.removeColumn(PATIENT_CARE_PLANS, 'date_legacy');
  await query.removeColumn(PATIENT_FAMILY_HISTORIES, 'recorded_date_legacy');
  await query.removeColumn(PATIENT_ISSUES, 'recorded_date_legacy');
}
