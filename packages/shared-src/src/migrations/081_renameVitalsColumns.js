/*
 * Rename the columns that were added in 081_addColumnsVitals from camel case to snake case
 */

module.exports = {
  up: async query => {
    await query.renameColumn('vitals', 'fastingBloodGlucose', 'fasting_blood_glucose');
    await query.renameColumn('vitals', 'urinePh', 'urine_ph');
    await query.renameColumn('vitals', 'urineLeukocytes', 'urine_leukocytes');
    await query.renameColumn('vitals', 'urineNitrites', 'urine_nitrites');
    await query.renameColumn('vitals', 'urineProtein', 'urine_protein');
    await query.renameColumn('vitals', 'bloodInUrine', 'blood_in_urine');
    await query.renameColumn('vitals', 'urineSpecificGravity', 'urine_specific_gravity');
    await query.renameColumn('vitals', 'urineKetone', 'urine_ketone');
    await query.renameColumn('vitals', 'urineBilirubin', 'urine_bilirubin');
    await query.renameColumn('vitals', 'urineGlucose', 'urine_glucose');
  },
  down: async query => {
    await query.renameColumn('vitals', 'fasting_blood_glucose', 'fastingBloodGlucose');
    await query.renameColumn('vitals', 'urine_ph', 'urinePh');
    await query.renameColumn('vitals', 'urine_leukocytes', 'urineLeukocytes');
    await query.renameColumn('vitals', 'urine_nitrites', 'urineNitrites');
    await query.renameColumn('vitals', 'urine_protein', 'urineProtein');
    await query.renameColumn('vitals', 'blood_in_urine', 'bloodInUrine');
    await query.renameColumn('vitals', 'urine_specific_gravity', 'urineSpecificGravity');
    await query.renameColumn('vitals', 'urine_ketone', 'urineKetone');
    await query.renameColumn('vitals', 'urine_bilirubin', 'urineBilirubin');
    await query.renameColumn('vitals', 'urine_glucose', 'urineGlucose');
  },
};
