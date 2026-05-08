import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn({ schema: 'fhir', tableName: 'encounters' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'immunizations' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'non_fhir_medici_report' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'organizations' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'patients' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'practitioners' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'service_requests' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'specimens' }, 'resolved', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Initially set all to true
  await query.sequelize.query(`UPDATE fhir.encounters SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.immunizations SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.non_fhir_medici_report SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.organizations SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.patients SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.practitioners SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.service_requests SET resolved = true;`);
  await query.sequelize.query(`UPDATE fhir.specimens SET resolved = true;`);

  // Then set the unresolved records to false
  await query.sequelize.query(`
    UPDATE fhir.encounters e
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(e.service_provider, 'type') = 'upstream://organization';
  `);

  await query.sequelize.query(`
    UPDATE fhir.encounters e
      SET 
        resolved = false
      WHERE (e.subject ->> 'type') = 'upstream://patient';
  `);

  await query.sequelize.query(`
    UPDATE fhir.patients p
        SET 
          resolved = false
        WHERE 'upstream://patient' = ANY(SELECT jsonb_path_query(link, '$[*].other.type') #>> '{}');
  `);

  await query.sequelize.query(`
    UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.specimen, 'type') = 'upstream://specimen';
  `);

  await query.sequelize.query(`
    UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.encounter, 'type') = 'upstream://encounter';
  `);

  await query.sequelize.query(`
    UPDATE fhir.service_requests sr
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(sr.requester, 'type') = 'upstream://practitioner';
  `);

  await query.sequelize.query(`
    UPDATE fhir.service_requests sr
        SET 
          resolved = true
        WHERE jsonb_extract_path_text(sr.subject, 'type') = 'upstream://patient';
  `);

  await query.sequelize.query(`
    UPDATE fhir.specimens s
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(s.collection, 'collector', 'type') = 'upstream://practitioner';
  `);

  await query.sequelize.query(`
    UPDATE fhir.specimens s
      SET 
        resolved = false
      WHERE jsonb_extract_path_text(s.request -> 0, 'type') = 'upstream://service_request';
  `);
}

export async function down(query) {
  await query.removeColumn({ schema: 'fhir', tableName: 'encounters' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'immunizations' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'non_fhir_medici_report' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'organizations' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'patients' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'practitioners' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'service_requests' }, 'resolved');
  await query.removeColumn({ schema: 'fhir', tableName: 'specimens' }, 'resolved');
}
