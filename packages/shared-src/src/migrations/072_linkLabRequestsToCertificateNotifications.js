const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.addColumn('certificate_notifications', 'lab_request_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'lab_requests', key: 'id' },
    });
    await query.sequelize.query(`
      INSERT INTO certificate_notifications
        (id, type, patient_id, status, lab_request_id)
      SELECT
        lab_requests.id,
        'icao.test',
        encounters.patient_id,
        'Ignore',
        lab_requests.id
      FROM lab_requests
      INNER JOIN encounters
        ON lab_requests.encounter_id = encounters.id
      WHERE lab_requests.status = 'published'
      ON CONFLICT DO NOTHING
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      DELETE FROM certificate_notifications
      WHERE status = 'Ignore'
    `);
    await query.removeColumn('certificate_notifications', 'lab_request_id');
  },
};
