import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';

import { closeDatabase, createTestDatabase } from '../utilities';
import { up as retireDuplicates } from '../../src/migrations/1794797127163-retireDuplicateInsurancePlanAttachments';
import {
  down as dropUniqueIndexes,
  up as addUniqueIndexes,
} from '../../src/migrations/1794797127243-addInsurancePlanAttachmentUniqueIndexes';

// Uniqueness was declared on the model but never reached the schema, and the table syncs both
// ways, so a deployment can already hold the same plan attached to an invoice twice. The indexes
// cannot be created over that, which would block the upgrade.
describe('retireDuplicateInsurancePlanAttachments migration', () => {
  let models;
  let sequelize;
  let invoice;
  let plan;
  let section;

  const queryInterface = () => sequelize.getQueryInterface();

  const attachmentsFor = async (invoiceId: string) =>
    models.InvoicesInvoiceInsurancePlan.findAll({
      where: { invoiceId },
      attributes: ['id', 'invoiceSectionId'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

  // Inserted below the model so the create path's own checks cannot stop the duplicate this
  // migration exists to clear up.
  const insertAttachment = (invoiceSectionId: string | null, createdAt: string) =>
    sequelize.query(
      `INSERT INTO invoices_invoice_insurance_plans
         (id, invoice_id, invoice_insurance_plan_id, invoice_section_id, created_at, updated_at)
       VALUES (gen_random_uuid(), :invoiceId, :planId, :sectionId, :createdAt, NOW())
       RETURNING id`,
      {
        replacements: {
          invoiceId: invoice.id,
          planId: plan.id,
          sectionId: invoiceSectionId,
          createdAt,
        },
      },
    );

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
    const patient = await models.Patient.create(fake(models.Patient));
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id }),
    );
    const user = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: user.id,
        endDate: null,
      }),
    );
    invoice = await models.Invoice.create(fake(models.Invoice, { encounterId: encounter.id }));
    plan = await models.InvoiceInsurancePlan.create(fake(models.InvoiceInsurancePlan));
    section = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'invoiceSection' }),
    );
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    // The indexes are already in place from the test database's own migration run, and they are
    // exactly what stops the duplicates being inserted.
    await dropUniqueIndexes(queryInterface());
    await models.InvoicesInvoiceInsurancePlan.destroy({ where: {}, force: true });
  });

  it('keeps the earliest of a duplicated invoice-wide attachment and retires the rest', async () => {
    await insertAttachment(null, '2026-01-01 09:00:00');
    await insertAttachment(null, '2026-01-02 09:00:00');
    await insertAttachment(null, '2026-01-03 09:00:00');

    await retireDuplicates(queryInterface());

    const remaining = await attachmentsFor(invoice.id);
    expect(remaining).toHaveLength(1);
  });

  it('retires a duplicate within one section and leaves the other sections alone', async () => {
    await insertAttachment(section.id, '2026-01-01 09:00:00');
    await insertAttachment(section.id, '2026-01-02 09:00:00');
    await insertAttachment(null, '2026-01-03 09:00:00');

    await retireDuplicates(queryInterface());

    const remaining = await attachmentsFor(invoice.id);
    expect(remaining.map(row => row.invoiceSectionId)).toEqual([section.id, null]);
  });

  it('leaves an invoice holding no duplicates untouched', async () => {
    await insertAttachment(section.id, '2026-01-01 09:00:00');
    await insertAttachment(null, '2026-01-02 09:00:00');

    await retireDuplicates(queryInterface());

    expect(await attachmentsFor(invoice.id)).toHaveLength(2);
  });

  it('lets the unique indexes be created over a database that held duplicates', async () => {
    await insertAttachment(null, '2026-01-01 09:00:00');
    await insertAttachment(null, '2026-01-02 09:00:00');

    await retireDuplicates(queryInterface());

    await expect(addUniqueIndexes(queryInterface())).resolves.toBeUndefined();
  });
});
