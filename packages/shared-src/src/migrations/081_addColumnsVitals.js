const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('vitals', 'gcs', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'hemoglobin', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'fastingBloodGlucose', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'urinePh', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'urineLeukocytes', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'urineNitrites', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'urobilinogen', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'urineProtein', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'bloodInUrine', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'urineSpecificGravity', {
      type: Sequelize.FLOAT,
    });
    await query.addColumn('vitals', 'urineKetone', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'urineBilirubin', {
      type: Sequelize.STRING,
    });
    await query.addColumn('vitals', 'urineGlucose', {
      type: Sequelize.FLOAT,
    });
  },
  down: async query => {
    await query.removeColumn('vitals', 'gcs');
    await query.removeColumn('vitals', 'hemoglobin');
    await query.removeColumn('vitals', 'fastingBloodGlucose');
    await query.removeColumn('vitals', 'urinePh');
    await query.removeColumn('vitals', 'urineLeukocytes');
    await query.removeColumn('vitals', 'urineNitrites');
    await query.removeColumn('vitals', 'urobilinogen');
    await query.removeColumn('vitals', 'urineProtein');
    await query.removeColumn('vitals', 'bloodInUrine');
    await query.removeColumn('vitals', 'urineSpecificGravity');
    await query.removeColumn('vitals', 'urineKetone');
    await query.removeColumn('vitals', 'urineBilirubin');
    await query.removeColumn('vitals', 'urineGlucose');
  },
};
