export async function up(query) {
  // copy id into display_id
  await query.sequelize.query(`
    ALTER TABLE imaging_requests
    ADD COLUMN display_id VARCHAR(255);

    UPDATE imaging_requests SET display_id = id;

    ALTER TABLE imaging_requests
    ALTER COLUMN display_id SET NOT NULL,
    ALTER COLUMN display_id SET DEFAULT uuid_generate_v4();
  `);

  // add index
  await query.sequelize.query(`
    CREATE INDEX imaging_requests_display_id ON imaging_requests (display_id);
  `);

  // add cascading to related tables
  await query.sequelize.query(`
    ALTER TABLE imaging_results
    DROP CONSTRAINT imaging_results_imaging_request_id_fkey,
    ADD CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE CASCADE;

    ALTER TABLE imaging_request_areas
    DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey,
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

  // assign new UUIDs in a deterministic way
  await query.sequelize.query(`
    UPDATE imaging_requests
    SET id = uuid_generate_v5(
      uuid_generate_v5(uuid_nil(), 'imaging_requests'),
      display_id
    );
  `);

  // rewrite note pages relationship
  await query.sequelize.query(`
    UPDATE note_pages
    SET record_id = imaging_requests.id
    FROM imaging_requests
    WHERE note_pages.record_id = imaging_requests.display_id
    AND note_pages.record_type = 'ImagingRequest';
  `);

  // change id to UUID
  await query.sequelize.query(`
    ALTER TABLE imaging_results DROP CONSTRAINT imaging_results_imaging_request_id_fkey;
    ALTER TABLE imaging_request_areas DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey;
    ALTER TABLE fhir.service_requests DROP CONSTRAINT service_requests_imaging_request_id_fkey;

    ALTER TABLE imaging_requests
    ALTER COLUMN id SET DATA TYPE UUID USING id::UUID,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id TYPE UUID USING imaging_request_id::UUID;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id TYPE UUID USING imaging_request_id::UUID;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id TYPE UUID USING upstream_id::UUID;
    
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
  // rewrite note pages relationship
  await query.sequelize.query(`
    UPDATE note_pages
    SET record_id = imaging_requests.display_id
    FROM imaging_requests
    WHERE note_pages.record_id = imaging_requests.id::varchar
    AND note_pages.record_type = 'ImagingRequest';
  `);

  // change id to varchar
  await query.sequelize.query(`
    ALTER TABLE imaging_results DROP CONSTRAINT imaging_results_imaging_request_id_fkey;
    ALTER TABLE imaging_request_areas DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey;
    ALTER TABLE fhir.service_requests DROP CONSTRAINT service_requests_imaging_request_id_fkey;

    ALTER TABLE imaging_requests
    ALTER COLUMN id SET DATA TYPE VARCHAR(255) USING id::VARCHAR,
    ALTER COLUMN id DROP DEFAULT;

    ALTER TABLE imaging_results
    ALTER COLUMN imaging_request_id TYPE VARCHAR(255) USING imaging_request_id::VARCHAR;

    ALTER TABLE imaging_request_areas
    ALTER COLUMN imaging_request_id TYPE VARCHAR(255) USING imaging_request_id::VARCHAR;

    ALTER TABLE fhir.service_requests
    ALTER COLUMN upstream_id TYPE VARCHAR(255) USING upstream_id::VARCHAR;

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

  // assign old display IDs
  await query.sequelize.query(`
    UPDATE imaging_requests
    SET id = display_id;
  `);

  // remove cascading from related tables
  await query.sequelize.query(`
    ALTER TABLE imaging_results
    DROP CONSTRAINT imaging_results_imaging_request_id_fkey,
    ADD CONSTRAINT imaging_results_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE NO ACTION;

    ALTER TABLE imaging_request_areas
    DROP CONSTRAINT imaging_request_area_imaging_request_id_fkey,
    ADD CONSTRAINT imaging_request_area_imaging_request_id_fkey
    FOREIGN KEY (imaging_request_id)
    REFERENCES imaging_requests (id)
    ON UPDATE NO ACTION;

    ALTER TABLE fhir.service_requests
    DROP CONSTRAINT service_requests_imaging_request_id_fkey;
  `);

  // remove index
  await query.sequelize.query(`DROP INDEX imaging_requests_display_id;`);

  // remove display_id column
  await query.sequelize.query(`ALTER TABLE imaging_requests DROP COLUMN display_id;`);
}
