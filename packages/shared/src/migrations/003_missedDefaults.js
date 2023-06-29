module.exports = {
  up: async query => {
    await query.changeColumn('encounter_diagnoses', 'certainty', {
      type: 'enum_encounter_diagnoses_certainty',
      defaultValue: 'suspected',
    });
    await query.changeColumn('patient_issues', 'type', {
      type: 'enum_patient_issues_type',
      defaultValue: 'issue',
      allowNull: false,
    });
  },
  down: async query => {
    await query.changeColumn('encounter_diagnoses', 'certainty', {
      type: 'enum_encounter_diagnoses_certainty',
      defaultValue: null,
      allowNull: true,
    });
    await query.changeColumn('patient_issues', 'type', {
      type: 'enum_patient_issues_type',
      defaultValue: null,
      allowNull: true,
    });
  },
};
