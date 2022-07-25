import {
  createDateTimeStringUpMigration,
  createDateTImeStringDownMigration,
} from './utils/dateTime';

module.exports = {
  up: async query => {
    await createDateTimeStringUpMigration(query, 'lab_requests', 'sample_time');
    await createDateTimeStringUpMigration(query, 'lab_requests', 'requested_date');
  },
  down: async query => {
    await createDateTImeStringDownMigration(query, 'lab_requests', 'sample_time');
    await createDateTImeStringDownMigration(query, 'lab_requests', 'requested_date');
  },
};
