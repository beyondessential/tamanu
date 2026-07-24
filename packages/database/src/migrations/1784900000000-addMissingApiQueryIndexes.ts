import { QueryInterface } from 'sequelize';

// Indexes backing hot API query paths that were previously running as
// sequential scans on large tables (audit of facility- and central-server
// endpoints against the schema, 2026-07).
const INDEXES: [name: string, definition: string][] = [
  // Tasking: GET /user/tasks (status + due_time worklist), GET /encounter/:id/tasks,
  // repeating-task delete/re-parent by parent_task_id, and the assignedTo EXISTS
  // subquery on task_designations.
  ['tasks_status_due_time', 'ON tasks (status, due_time)'],
  ['tasks_encounter_id', 'ON tasks (encounter_id)'],
  ['tasks_parent_task_id', 'ON tasks (parent_task_id)'],
  ['task_designations_task_id', 'ON task_designations (task_id)'],
  // GET /user/tasks joins designations -> users via user_designations on
  // designation_id; the existing index only covers user_id.
  ['user_designations_designation_id', 'ON user_designations (designation_id)'],

  // Notification bell: polled per client, filters user_id + status (+ created_time
  // window) and sorts by created_time.
  ['notifications_user_id_status_created_time', 'ON notifications (user_id, status, created_time)'],
  // Patient merge updates notifications by patient_id.
  ['notifications_patient_id', 'ON notifications (patient_id)'],

  // Patient appointment tabs (facility + patient portal) filter by patient_id.
  ['appointments_patient_id_start_time', 'ON appointments (patient_id, start_time)'],
  // Location-booking conflict checks filter by location_id + overlap; mirrors the
  // existing partial index on (location_group_id, start_time).
  [
    'appointments_location_id_start_time',
    "ON appointments (location_id, start_time) WHERE deleted_at IS NULL AND status <> 'Cancelled'",
  ],

  // GET /encounter/:id/medications and discharge-medication lookups filter by
  // encounter_id alone; the existing composite leads with prescription_id.
  ['encounter_prescriptions_encounter_id', 'ON encounter_prescriptions (encounter_id)'],

  // Invoicing: invoice-per-encounter lookups on open/create/update/payment, and
  // the insurer payment importer's per-row display_id lookups.
  ['invoices_encounter_id', 'ON invoices (encounter_id)'],
  ['invoices_display_id', 'ON invoices (display_id)'],
  // Labs/imaging worklists run correlated subqueries on (source_record_type,
  // source_record_id); the existing unique index leads with invoice_id.
  [
    'invoice_items_source_record_type_source_record_id',
    'ON invoice_items (source_record_type, source_record_id)',
  ],
  ['invoice_payments_invoice_id', 'ON invoice_payments (invoice_id)'],
  ['invoice_discounts_invoice_id', 'ON invoice_discounts (invoice_id)'],
  ['invoice_item_discounts_invoice_item_id', 'ON invoice_item_discounts (invoice_item_id)'],

  // Pharmacy/dispensing join chain from encounters.
  ['pharmacy_orders_encounter_id', 'ON pharmacy_orders (encounter_id)'],
  ['pharmacy_order_prescriptions_pharmacy_order_id', 'ON pharmacy_order_prescriptions (pharmacy_order_id)'],
  ['pharmacy_order_prescriptions_prescription_id', 'ON pharmacy_order_prescriptions (prescription_id)'],

  // Lab request status history, ordered newest-first.
  ['lab_request_logs_lab_request_id_created_at', 'ON lab_request_logs (lab_request_id, created_at)'],

  // Program registry registrations view filters by program_registry_id alone; the
  // PK leads with patient_id. Conditions are joined per registration.
  ['patient_program_registrations_program_registry_id', 'ON patient_program_registrations (program_registry_id)'],
  [
    'patient_program_registration_conditions_registration_id',
    'ON patient_program_registration_conditions (patient_program_registration_id)',
  ],

  // Ongoing prescriptions (facility + patient portal) filter by patient_id and
  // join prescriptions on prescription_id.
  ['patient_ongoing_prescriptions_patient_id', 'ON patient_ongoing_prescriptions (patient_id)'],
  ['patient_ongoing_prescriptions_prescription_id', 'ON patient_ongoing_prescriptions (prescription_id)'],

  // GET /patient/:id/documentMetadata filters patient_id OR encounter_id; only
  // encounter_id was indexed, so the OR degraded to a seq scan.
  ['document_metadata_patient_id', 'ON document_metadata (patient_id)'],

  // Clinician-filtered assignment calendar; existing composite leads with date.
  ['location_assignments_user_id_date', 'ON location_assignments (user_id, date)'],

  // Imaging worklist approved-status correlated subquery.
  ['imaging_request_areas_imaging_request_id', 'ON imaging_request_areas (imaging_request_id)'],

  // Password reset lookups; the table is never pruned so it grows unbounded.
  ['one_time_logins_user_id_token', 'ON one_time_logins (user_id, token)'],

  // Reminder contacts list.
  ['patient_contacts_patient_id', 'ON patient_contacts (patient_id)'],

  // Patient merge updates certificate_notifications by patient_id.
  ['certificate_notifications_patient_id', 'ON certificate_notifications (patient_id)'],

  // Portal login/token request looks up lower(email) pre-auth; the plain unique
  // index on email cannot serve the case-insensitive comparison.
  ['portal_users_lower_email', 'ON portal_users (lower(email))'],

  // GET /portal/survey/:surveyId joins assignments by survey_id; the existing
  // composite leads with patient_id.
  ['portal_survey_assignments_survey_id', 'ON portal_survey_assignments (survey_id)'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [name, definition] of INDEXES) {
    await query.sequelize.query(`CREATE INDEX IF NOT EXISTS ${name} ${definition};`);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const [name] of INDEXES) {
    await query.sequelize.query(`DROP INDEX IF EXISTS ${name};`);
  }
}
