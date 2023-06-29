/* eslint-disable camelcase */

import { v4 as uuidv4 } from 'uuid';

const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    const requests = await query.sequelize.query(
      'SELECT * from lab_requests WHERE note IS NOT NULL;',
    );

    for (const request of requests[0]) {
      const { id, created_at, updated_at, note } = request;
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
    await query.addColumn('lab_requests', 'note', { type: Sequelize.STRING, allowNull: true });
    // the front-end will always set an author id through the new lab request notes flow,
    // so while this does rely on the assumption that no LabRequest note will be created
    // without an author_id via the app, it's the safest assumption we can rely on for this down migration.
    const notes = await query.sequelize.query(
      "SELECT * from notes WHERE record_type = 'LabRequest' AND author_id IS NULL;",
    );

    for (const request of notes[0]) {
      const { record_id, content } = request;
      await query.sequelize.query(
        `UPDATE lab_requests
          SET note = $1
          WHERE id = $2;
          `,
        {
          bind: [content, record_id],
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }
  },
};
