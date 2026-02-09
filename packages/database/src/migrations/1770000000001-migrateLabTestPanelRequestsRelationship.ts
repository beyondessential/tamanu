import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Migrate the relationship: for each lab_request with a lab_test_panel_request_id,
  // set the lab_request_id on the corresponding lab_test_panel_request
  await query.sequelize.query(`
    UPDATE lab_test_panel_requests
    SET lab_request_id = lab_requests.id
    FROM lab_requests
    WHERE lab_requests.lab_test_panel_request_id = lab_test_panel_requests.id
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: This assumes the old column still exists and will only restore 
  // the relationship for panel requests that are the only one on a lab request
  await query.sequelize.query(`
    UPDATE lab_requests
    SET lab_test_panel_request_id = lab_test_panel_requests.id
    FROM lab_test_panel_requests
    WHERE lab_test_panel_requests.lab_request_id = lab_requests.id
  `);
}
