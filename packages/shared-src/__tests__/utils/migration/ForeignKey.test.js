import { ForeignKey } from '../../../src/utils/migration/ForeignKey';

describe('ForeignKey', () => {
  const query = {
    addConstraint: jest.fn(),
    removeConstraint: jest.fn(),
  };

  describe('create()', () => {
    describe('input validation', () => {
      it('throws for empty query', () => {
        [null, undefined].forEach(emptyQuery => {
          const callback = () => ForeignKey.create(emptyQuery);
          expect(callback).toThrow('query');
        });
      });

      it('throws for empty required fields', () => {
        const emptyFieldsList = [
          undefined,
          {},
          { referencedEntity: 'ref_entity' },
          { table: 'table' },
        ];

        emptyFieldsList.forEach(emptyFields => {
          const callback = () => ForeignKey.create(query, emptyFields);
          expect(callback).toThrow('required');
        });
      });
    });

    it('returns a `ForeignKey` instance', () => {
      const fk = ForeignKey.create(query, { table: 'test', referencedEntity: 'test' });
      expect(fk).toBeInstanceOf(ForeignKey);
    });

    it('uses the provide fields', () => {
      const fields = {
        table: 'table',
        referencedEntity: 'ref_entity',
        column: 'column',
        referencedTable: 'ref_table',
        referencedColumn: 'ref_column',
      };

      const fk = ForeignKey.create(query, fields);
      expect(fk).toMatchObject(fields);
    });

    describe('default value creation', () => {
      const baseFK = ForeignKey.create(query, {
        table: 'table',
        referencedEntity: 'ref_entity',
      });

      it('column', () => {
        expect(baseFK).toHaveProperty('column', 'ref_entity_id');
      });

      it('referencedTable', () => {
        expect(baseFK).toHaveProperty('referencedTable', 'ref_entities');
      });

      it('referencedColumn', () => {
        expect(baseFK).toHaveProperty('referencedColumn', 'id');
      });
    });
  });

  it('constructor builds a name using the provided fields', () => {
    const fk = ForeignKey.create(query, {
      table: 'table',
      referencedEntity: 'ref_entity',
    });
    expect(fk).toHaveProperty('name', 'table_ref_entity_id_fkey');
  });

  it('add()', async () => {
    const fk = ForeignKey.create(query, {
      table: 'table',
      referencedEntity: 'ref_entity',
      column: 'column',
      referencedTable: 'ref_table',
      referencedColumn: 'ref_column',
    });

    await fk.add();
    expect(query.addConstraint).toHaveBeenCalledWith('table', ['column'], {
      type: 'foreign key',
      name: 'table_ref_entity_id_fkey',
      references: {
        table: 'ref_table',
        field: 'ref_column',
      },
    });
  });

  it('drop()', async () => {
    const fk = ForeignKey.create(query, {
      table: 'table',
      referencedEntity: 'ref_entity',
    });

    await fk.drop();
    expect(query.removeConstraint).toHaveBeenCalledWith('table', 'table_ref_entity_id_fkey');
  });
});
