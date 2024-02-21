/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addConstraint('program_registries', {
    type: 'foreign key',
    name: 'program_registries_program_id_fkey',
    fields: ['program_id'],
    references: {
      table: 'programs',
      field: 'id',
    },
  });

  await query.addConstraint('program_registry_clinical_statuses', {
    type: 'foreign key',
    name: 'program_registry_clinical_statuses_program_registry_id_fkey',
    fields: ['program_registry_id'],
    references: {
      table: 'program_registries',
      field: 'id',
    },
  });

  await query.addConstraint('program_registry_conditions', {
    type: 'foreign key',
    name: 'program_registry_conditions_program_registry_id_fkey',
    fields: ['program_registry_id'],
    references: {
      table: 'program_registries',
      field: 'id',
    },
  });

  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_patient_id_fkey',
    fields: ['patient_id'],
    references: {
      table: 'patients',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_program_registry_id_fkey',
    fields: ['program_registry_id'],
    references: {
      table: 'program_registries',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_clinical_status_id_fkey',
    fields: ['clinical_status_id'],
    references: {
      table: 'program_registry_clinical_statuses',
      field: 'id',
    },
  });
  await query.changeColumn('patient_program_registrations', 'clinician_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_clinician_id_fkey',
    fields: ['clinician_id'],
    references: {
      table: 'users',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_facility_id_fkey',
    fields: ['facility_id'],
    references: {
      table: 'facilities',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_registering_facility_id_fkey',
    fields: ['registering_facility_id'],
    references: {
      table: 'facilities',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registrations', {
    type: 'foreign key',
    name: 'patient_program_registrations_village_id_fkey',
    fields: ['village_id'],
    references: {
      table: 'reference_data',
      field: 'id',
    },
  });

  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_patient_id_fkey',
    fields: ['patient_id'],
    references: {
      table: 'patients',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_program_registry_id_fkey',
    fields: ['program_registry_id'],
    references: {
      table: 'program_registries',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_program_registry_condition_id_fkey',
    fields: ['program_registry_condition_id'],
    references: {
      table: 'program_registry_conditions',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_clinician_id_fkey',
    fields: ['clinician_id'],
    references: {
      table: 'users',
      field: 'id',
    },
  });
  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_deletion_clinician_id_fkey',
    fields: ['deletion_clinician_id'],
    references: {
      table: 'users',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeConstraint('program_registries', 'program_registries_program_id_fkey');

  await query.removeConstraint('program_registry_clinical_statuses', 'program_registry_clinical_statuses_program_registry_id_fkey');

  await query.removeConstraint('program_registry_conditions', 'program_registry_clinical_statuses_program_registry_id_fkey');

  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_patient_id_fkey');
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_program_registry_id_fkey');
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_clinical_status_id_fkey');
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_clinician_id_fkey');
  await query.changeColumn('patient_program_registrations', 'clinician_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_facility_id_fkey');
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_registering_facility_id_fkey');
  await query.removeConstraint('patient_program_registrations', 'patient_program_registrations_village_id_fkey');

  await query.removeConstraint('patient_program_registration_conditions', 'patient_program_registration_conditions_patient_id_fkey');
  await query.removeConstraint('patient_program_registration_conditions', 'patient_program_registration_conditions_program_registry_id_fkey');
  await query.removeConstraint('patient_program_registration_conditions', 'patient_program_registration_conditions_program_registry_condition_id_fkey');
  await query.removeConstraint('patient_program_registration_conditions', 'patient_program_registration_conditions_clinician_id_fkey');
  await query.removeConstraint('patient_program_registration_conditions', 'patient_program_registration_conditions_deletion_clinician_id_fkey');
}
