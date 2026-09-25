import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Move each existing single request-to-panel link into the new one-to-many structure. Historical
  // lab_tests are deliberately not stamped with a panel request: a request holding exactly one
  // panel request whose tests carry no attribution is read as "all tests belong to that panel".
  await query.sequelize.query(`
    UPDATE lab_test_panel_requests ptr
    SET lab_request_id = lr.id
    FROM lab_requests lr
    WHERE lr.lab_test_panel_request_id = ptr.id
      AND ptr.lab_request_id IS NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: restores the single link on lab_requests from the panel request. A request that
  // now holds several panel requests cannot be represented by the single link and keeps only one.
  await query.sequelize.query(`
    UPDATE lab_requests lr
    SET lab_test_panel_request_id = ptr.id
    FROM lab_test_panel_requests ptr
    WHERE ptr.lab_request_id = lr.id;
  `);
}
