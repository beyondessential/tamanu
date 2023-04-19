export async function up(query) {
  // change ids back to varchar
  await query.sequelize.query(`
    ALTER TABLE imaging_results DROP CONSTRAINT imaging_results_imaging_request_id_fkey;
    ALTER TABLE imaging_request_areas DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey;
    ALTER TABLE fhir.service_requests DROP CONSTRAINT service_requests_imaging_request_id_fkey;

    ALTER TABLE imaging_requests
    ALTER COLUMN id SET DATA TYPE varchar USING id::varchar;

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id SET DATA TYPE varchar USING imaging_request_id::varchar;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id SET DATA TYPE varchar USING imaging_request_id::varchar;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id SET DATA TYPE varchar USING upstream_id::varchar;

    ALTER TABLE imaging_results
    ADD CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE imaging_request_areas
    ADD CONSTRAINT imaging_request_area_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE fhir.service_requests
    ADD CONSTRAINT service_requests_imaging_request_id_fkey
    FOREIGN KEY (upstream_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;
  `);
}

export async function down(query) {
  // this might not be possible if non-UUIDs are used
  await query.sequelize.query(`
    ALTER TABLE imaging_results DROP CONSTRAINT imaging_results_imaging_request_id_fkey;
    ALTER TABLE imaging_request_areas DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey;
    ALTER TABLE fhir.service_requests DROP CONSTRAINT service_requests_imaging_request_id_fkey;

    ALTER TABLE imaging_requests
    ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id SET DATA TYPE uuid USING imaging_request_id::uuid;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id SET DATA TYPE uuid USING imaging_request_id::uuid;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id SET DATA TYPE uuid USING upstream_id::uuid;

    ALTER TABLE imaging_results
    ADD CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE imaging_request_areas
    ADD CONSTRAINT imaging_request_area_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE fhir.service_requests
    ADD CONSTRAINT service_requests_imaging_request_id_fkey
    FOREIGN KEY (upstream_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;
  `);
}
