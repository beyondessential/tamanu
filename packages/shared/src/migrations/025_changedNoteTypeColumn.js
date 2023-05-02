const Sequelize = require('sequelize');

const NOTE_TYPES = ['system', 'other', 'treatmentPlan'];

module.exports = {
  up: async query => {
    await query.changeColumn('notes', 'note_type', {
      type: Sequelize.STRING,
    });
  },

  down: async query => {
    await query.changeColumn('notes', 'note_type', {
      type: Sequelize.ENUM(NOTE_TYPES),
    });
  },
};
