const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // sequelize doesn't support altering default value types for enums, so we change the column to a string...
    await query.changeColumn('encounter_diagnoses', 'certainty', {
      type: Sequelize.STRING,
    });
    // ...then drop the enum...
    await query.sequelize.query('DROP TYPE IF EXISTS "enum_encounter_diagnoses_certainty";');
    // ...and THEN we can set a default value
    await query.changeColumn('encounter_diagnoses', 'certainty', {
      type: Sequelize.STRING,
      defaultValue: 'suspected',
    });
  },

  down: async query => {
    // technically speaking, migrating a string to an enum isn't reversible, so we make a temp column...
    await query.renameColumn('encounter_diagnoses', 'certainty', 'certainty_old');
    // ...recreate the enum column and default it to suspected...
    await query.addColumn('encounter_diagnoses', 'certainty', {
      type: Sequelize.ENUM(['suspected', 'confirmed']),
      defaultValue: 'suspected',
    });
    // ...set certainty based on the temp column, since it's the only value other than suspected...
    await query.sequelize.query(
      `UPDATE encounter_diagnoses SET certainty = 'confirmed' WHERE certainty_old = 'confirmed';`,
    );
    // ...and get rid of the old column
    await query.removeColumn('encounter_diagnoses', 'certainty_old');
  },
};
