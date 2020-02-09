import { Sequelize } from 'sequelize';
import { Model } from './Model';

const CODE_TYPES = [
  'icd10',
  'allergy',
  'condition',
  'triage',
  'procedure',
  'drug',
];

export class ReferenceData extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        type: Sequelize.ENUM(CODE_TYPES),
        name: Sequelize.STRING,
      },
      {
        ...options,
        indexes: [
          {
            unique: false,
            fields: ['type'],
          },
          {
            unique: false,
            name: 'code_by_type',
            fields: ['code', 'type'],
          },
        ],
      },
    );
  }
}
