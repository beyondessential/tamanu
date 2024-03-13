export async function up(query) {
  await query.sequelize.query(`
    DROP TABLE "fhir"."diagnostic_reports";
  `);
}

export async function down(query) {
  await query.sequelize.query(`
      CREATE TABLE fhir.diagnostic_reports (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        version_id uuid NOT NULL DEFAULT uuid_generate_v4(),
        upstream_id character varying(255) NOT NULL,
        last_updated timestamp without time zone NOT NULL DEFAULT now(),
        extension jsonb NOT NULL DEFAULT '[]'::jsonb,
        identifier jsonb NOT NULL DEFAULT '[]'::jsonb,
        status text NOT NULL,
        code jsonb NOT NULL,
        subject jsonb,
        effective_date_time text,
        issued text,
        performer jsonb NOT NULL DEFAULT '[]'::jsonb,
        result jsonb NOT NULL DEFAULT '[]'::jsonb
    );
  `);
}
