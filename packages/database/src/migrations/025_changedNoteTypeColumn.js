const Sequelize = require('sequelize');

const NOTE_TYPES = ['system', 'other', 'treatmentPlan'];

export default {
  up: async (query) => {
    await query.changeColumn('notes', 'note_type', {
      type: Sequelize.STRING,
    });
  },

  down: async (query) => {
    await query.changeColumn('notes', 'note_type', {
      type: Sequelize.ENUM(NOTE_TYPES),
    });
  },
};
