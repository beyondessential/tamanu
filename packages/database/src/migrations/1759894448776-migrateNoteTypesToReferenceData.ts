import { DataTypes, QueryInterface } from 'sequelize';
import { REFERENCE_TYPES } from '@tamanu/constants';

/**
 * Hardcoded note types to create in reference_data.
 * These correspond to the NOTE_TYPES constant but are hardcoded here to ensure
 * migration stability regardless of constant changes.
 */
const NOTE_TYPE_REFERENCE_DATA = [
  {
    id: 'notetype-treatmentPlan',
    code: 'treatmentPlan',
    name: 'Treatment plan',
    system_required: true,
  },
  {
    id: 'notetype-discharge',
    code: 'discharge',
    name: 'Discharge planning',
    system_required: true,
  },
  {
    id: 'notetype-clinicalMobile',
    code: 'clinicalMobile',
    name: 'Clinical note (mobile)',
    system_required: true,
  },
  {
    id: 'notetype-handover',
    code: 'handover',
    name: 'Handover note',
    system_required: true,
  },
  {
    id: 'notetype-areaToBeImaged',
    code: 'areaToBeImaged',
    name: 'Area to be imaged',
    system_required: true,
  },
  {
    id: 'notetype-resultDescription',
    code: 'resultDescription',
    name: 'Result description',
    system_required: true,
  },
  {
    id: 'notetype-other',
    code: 'other',
    name: 'Other',
    system_required: true,
  },
  {
    id: 'notetype-system',
    code: 'system',
    name: 'System',
    system_required: true,
  },
  {
    id: 'notetype-admission',
    code: 'admission',
    name: 'Admission',
    system_required: false,
  },
  {
    id: 'notetype-medical',
    code: 'medical',
    name: 'Medical',
    system_required: false,
  },
  {
    id: 'notetype-surgical',
    code: 'surgical',
    name: 'Surgical',
    system_required: false,
  },
  {
    id: 'notetype-nursing',
    code: 'nursing',
    name: 'Nursing',
    system_required: false,
  },
  {
    id: 'notetype-dietary',
    code: 'dietary',
    name: 'Dietary',
    system_required: false,
  },
  {
    id: 'notetype-pharmacy',
    code: 'pharmacy',
    name: 'Pharmacy',
    system_required: false,
  },
  {
    id: 'notetype-physiotherapy',
    code: 'physiotherapy',
    name: 'Physiotherapy',
    system_required: false,
  },
  {
    id: 'notetype-social',
    code: 'social',
    name: 'Social welfare',
    system_required: false,
  },
];

export async function up(query: QueryInterface) {
  for (const noteType of NOTE_TYPE_REFERENCE_DATA) {
    await query.sequelize.query(
      `
      INSERT INTO reference_data (id, type, code, name, system_required, visibility_status)
      VALUES (:id, :type, :code, :name, :system_required, 'current')
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        system_required = EXCLUDED.system_required
      `,
      {
        replacements: {
          id: noteType.id,
          type: REFERENCE_TYPES.NOTE_TYPE,
          code: noteType.code,
          name: noteType.name,
          system_required: noteType.system_required,
        },
      },
    );
  }

  await query.addColumn('notes', 'note_type_id', {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });

  await query.sequelize.query(
    `
    UPDATE notes
    SET note_type_id = reference_data.id
    FROM reference_data
    WHERE reference_data.type = :noteType
      AND reference_data.code = notes.note_type
    `,
    {
      replacements: { noteType: REFERENCE_TYPES.NOTE_TYPE },
    },
  );

  await query.changeColumn('notes', 'note_type_id', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });

  await query.removeColumn('notes', 'note_type');
}

export async function down(query: QueryInterface) {
  await query.addColumn('notes', 'note_type', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await query.sequelize.query(
    `
    UPDATE notes
    SET note_type = reference_data.code
    FROM reference_data
    WHERE reference_data.id = notes.note_type_id
      AND reference_data.type = :noteType
    `,
    {
      replacements: { noteType: REFERENCE_TYPES.NOTE_TYPE },
    },
  );

  await query.changeColumn('notes', 'note_type', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });

  await query.removeColumn('notes', 'note_type_id');

  await query.sequelize.query(
    `DELETE FROM reference_data WHERE type = :noteType`,
    {
      replacements: { noteType: REFERENCE_TYPES.NOTE_TYPE },
    },
  );
}
