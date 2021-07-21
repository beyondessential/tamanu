import { v4 as uuidv4 } from 'uuid';
const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // get all lab requests
    const requests = await query.sequelize.query(
      'SELECT * from lab_requests WHERE note IS NOT NULL;',
    );
    // loop through em
    for (const request of requests[0]) {
      const { id, created_at, updated_at, note } = request;
      // they all have a note
      await query.sequelize.query(
        `INSERT INTO notes
          (id, record_id, created_at, updated_at, record_type, date, note_type, content)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8);
          `,
        {
          bind: [uuidv4(), id, created_at, updated_at, 'LabRequest', created_at, 'other', note],
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    await query.removeColumn('lab_requests', 'note');
  },

  down: async query => {
    
  },
};
