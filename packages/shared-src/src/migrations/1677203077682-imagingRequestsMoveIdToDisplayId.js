//TODO: facility srever
export async function up(query) {
  // copy id into display_id
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    ADD COLUMN display_id VARCHAR(255) NOT NULL
    USING (id::VARCHAR);
  `);

  // add index
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    ADD INDEX imaging_requests_display_id (display_id);
  `);

  // add cascading to related tables
  query.sequelize.query(`
    ALTER TABLE imaging_results
    ALTER CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE imaging_request_areas
    ALTER CONSTRAINT imaging_request_area_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE fhir.service_requests
    ADD CONSTRAINT service_requests_imaging_request_id_fkey
    FOREIGN KEY (upstream_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;
  `);

  // assign new UUIDs
  query.sequelize.query(`
    UPDATE imaging_requests
    SET id = uuid_generate_v4();
  `);

  // rewrite note pages relationship
  query.sequelize.query(`
    UPDATE note_pages
    SET record_id = imaging_requests.id
    FROM imaging_requests
    WHERE note_pages.record_id = imaging_requests.display_id
    AND note_pages.record_type = 'ImagingRequest';
  `);

  // change id to UUID
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    ALTER COLUMN id TYPE UUID USING id::UUID;

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id TYPE UUID USING imaging_request_id::UUID;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id TYPE UUID USING imaging_request_id::UUID;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id TYPE UUID USING upstream_id::UUID;
  `);
}

export async function down(query) {
  // rewrite note pages relationship
  query.sequelize.query(`
    UPDATE note_pages
    SET record_id = imaging_requests.display_id
    FROM imaging_requests
    WHERE note_pages.record_id = imaging_requests.id
    AND note_pages.record_type = 'ImagingRequest';
  `);

  // change id to varchar
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id TYPE VARCHAR(255) USING imaging_request_id::VARCHAR;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id TYPE VARCHAR(255) USING imaging_request_id::VARCHAR;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id TYPE VARCHAR(255) USING upstream_id::VARCHAR;
  `);

  // assign old display IDs
  query.sequelize.query(`
    UPDATE imaging_requests
    SET id = display_id;
  `);

  // remove cascading from related tables
  query.sequelize.query(`
    ALTER TABLE imaging_results
    ALTER CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE NO ACTION;

    ALTER TABLE imaging_request_areas
    ALTER CONSTRAINT imaging_request_area_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE NO ACTION;

    ALTER TABLE fhir.service_requests
    DROP CONSTRAINT service_requests_imaging_request_id_fkey;
  `);

  // remove index
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    DROP INDEX imaging_requests_display_id;
  `);

  // remove display_id column
  query.sequelize.query(`
    ALTER TABLE imaging_requests
    DROP COLUMN display_id;
  `);
}
