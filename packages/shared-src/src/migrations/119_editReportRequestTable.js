const Sequelize = require('sequelize');

// Including the ones unused just for historical completeness
const OLD_REPORT_REQUEST_STATUSES = {
  RECEIVED: 'Received',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  ERROR: 'Error',
};

const NEW_REPORT_REQUEST_STATUSES = {
  RECEIVED_BY_FACILITY: 'received_by_facility',
  RECEIVED_BY_CENTRAL: 'received_by_central_server',
  PROCESSING_START: 'processing_started',
  PROCESSING_FINISHED: 'processing_finished',
  EMAILED: 'emailed',
  ERROR: 'error',
};

module.exports = {
  up: async query => {
    await query.addColumn('report_requests', 'process_finished_time', {
      type: Sequelize.DATE,
    });

    await query.sequelize.query(
      `
      UPDATE report_requests
      SET status =
        CASE
          WHEN status = ${OLD_REPORT_REQUEST_STATUSES.RECEIVED} THEN ${NEW_REPORT_REQUEST_STATUSES.RECEIVED_BY_CENTRAL}
          WHEN status = ${OLD_REPORT_REQUEST_STATUSES.PROCESSING} THEN ${NEW_REPORT_REQUEST_STATUSES.PROCESSING_START}
          WHEN status = ${OLD_REPORT_REQUEST_STATUSES.PROCESSED} THEN ${NEW_REPORT_REQUEST_STATUSES.EMAILED}
          WHEN status = ${OLD_REPORT_REQUEST_STATUSES.ERROR} THEN ${NEW_REPORT_REQUEST_STATUSES.ERROR}
      END
      `,
    );
  },

  down: async query => {
    await query.removeColumn('report_requests', 'process_finished_time');

    await query.sequelize.query(
      `
      UPDATE report_requests
      SET status =
        CASE
          WHEN status = ${NEW_REPORT_REQUEST_STATUSES.RECEIVED_BY_CENTRAL} THEN ${OLD_REPORT_REQUEST_STATUSES.RECEIVED}
          WHEN status = ${NEW_REPORT_REQUEST_STATUSES.PROCESSING_START} THEN ${OLD_REPORT_REQUEST_STATUSES.PROCESSING}
          WHEN status = ${NEW_REPORT_REQUEST_STATUSES.EMAILED} THEN ${OLD_REPORT_REQUEST_STATUSES.PROCESSED}
          WHEN status = ${NEW_REPORT_REQUEST_STATUSES.ERROR} THEN ${OLD_REPORT_REQUEST_STATUSES.ERROR}
      END
      `,
    );
  },
};
