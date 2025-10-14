import { DataTypes, QueryInterface } from 'sequelize';
import { NOTE_TYPES, NOTE_TYPE_LABELS, REFERENCE_TYPES } from '@tamanu/constants';

const SYSTEM_REQUIRED_NOTE_TYPES = [
  NOTE_TYPES.TREATMENT_PLAN,
  NOTE_TYPES.DISCHARGE,
  NOTE_TYPES.CLINICAL_MOBILE,
  NOTE_TYPES.HANDOVER,
];

const NOTE_TYPE_CONFIGS = Object.values(NOTE_TYPES).map(code => ({
  code,
  name: NOTE_TYPE_LABELS[code] || code,
}));

const makeNoteTypeId = (code: string): string => `notetype-${code}`;

export async function up(query: QueryInterface) {
  const referenceDataRecords = NOTE_TYPE_CONFIGS.map(({ code, name }) => ({
    id: makeNoteTypeId(code),
    type: REFERENCE_TYPES.NOTE_TYPE,
    code,
    name,
    system_required: SYSTEM_REQUIRED_NOTE_TYPES.includes(code),
    visibility_status: 'current',
  }));

  await query.bulkInsert('reference_data', referenceDataRecords);

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

  await query.changeColumn('notes', 'note_type', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn('notes', 'note_type_id');

  await query.sequelize.query(
    `DELETE FROM reference_data WHERE type = :noteType`,
    {
      replacements: { noteType: REFERENCE_TYPES.NOTE_TYPE },
    },
  );

  await query.changeColumn('notes', 'note_type', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });
}
