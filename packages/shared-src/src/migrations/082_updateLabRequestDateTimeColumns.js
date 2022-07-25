import { createUpMigration, createDownMigration } from './utils/dateTime';

module.exports = {
  up: async query => {
    await createUpMigration(query, 'lab_requests', 'sample_time');
    await createUpMigration(query, 'lab_requests', 'requested_date');
  },
  down: async query => {
    await createDownMigration(query, 'lab_requests', 'sample_time');
    await createDownMigration(query, 'lab_requests', 'requested_date');
  },
};
