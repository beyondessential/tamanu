import { QueryInterface } from 'sequelize';

const SELF_REFERENCING_FKS = [
  {
    table: 'invoice_payments',
    column: 'original_payment_id',
    constraint: 'invoice_payments_original_payment_id_fkey',
  },
  {
    table: 'tasks',
    column: 'parent_task_id',
    constraint: 'tasks_parent_task_id_fkey',
  },
];

export async function up(query: QueryInterface): Promise<void> {
  for (const { table, column, constraint } of SELF_REFERENCING_FKS) {
    // Have to drop the constraint first because it's not possible to alter a constraint to be deferrable
    await query.sequelize.query(`
      ALTER TABLE ${table}
      DROP CONSTRAINT ${constraint};
    `);
    await query.sequelize.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT ${constraint}
        FOREIGN KEY (${column})
        REFERENCES ${table}(id)
        DEFERRABLE INITIALLY IMMEDIATE;
    `);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const { table, column, constraint } of SELF_REFERENCING_FKS) {
    await query.sequelize.query(`
      ALTER TABLE ${table}
      DROP CONSTRAINT ${constraint};
    `);
    await query.sequelize.query(`
      ALTER TABLE ${table}
      ADD CONSTRAINT ${constraint}
        FOREIGN KEY (${column})
        REFERENCES ${table}(id);
    `);
  }
}
