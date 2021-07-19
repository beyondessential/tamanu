import { plural } from 'pluralize';
import * as yup from 'yup';

const fieldsSchema = yup.object().shape({
  table: yup.string().required(),
  referencedEntity: yup.string().required(),
  column: yup.string(),
  referencedTable: yup.string(),
  referencedColumn: yup.string(),
  name: yup.string(),
});

export class ForeignKey {
  static create = (query, fields) => {
    if (!query) {
      throw new Error(`Please provide a query in ForeignKey.create()`);
    }

    this.validate(fields);
    const parsedFields = {
      table: fields.table,
      referencedEntity: fields.referencedEntity,
      column: fields.column || `${fields.referencedEntity}_id`,
      referencedTable: fields.referencedTable || plural(fields.referencedEntity),
      referencedColumn: fields.referencedColumn || 'id',
    };

    return new ForeignKey(query, parsedFields);
  };

  static validate = fields => {
    try {
      fieldsSchema.validateSync(fields);
    } catch (error) {
      throw new Error(`ForeignKey validation error: ${error.message}`);
    }
  };

  constructor(query, fields) {
    this.query = query;

    this.table = fields.table;
    this.referencedEntity = fields.referencedEntity;
    this.column = fields.column;
    this.referencedTable = fields.referencedTable;
    this.referencedColumn = fields.referencedColumn;
    this.name = this.buildName();
  }

  buildName = () => [this.table, `${this.referencedEntity}_id`, 'fkey'].join('_');

  add = async () => {
    await this.query.addConstraint(this.table, [this.column], {
      type: 'foreign key',
      name: this.name,
      references: {
        table: this.referencedTable,
        field: this.referencedColumn,
      },
    });
  };

  drop = async () => this.query.removeConstraint(this.table, this.name);

  getTable = () => this.table;

  getColumn = () => this.column;

  setReferencedTable = referencedTable => {
    this.referencedTable = referencedTable;
  };
}
