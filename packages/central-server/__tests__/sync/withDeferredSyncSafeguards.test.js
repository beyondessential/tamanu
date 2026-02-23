import { withDeferredSyncSafeguards } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';
import { SYSTEM_USER_UUID } from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../utilities';

describe('withDeferredSyncSafeguards', () => {
  let ctx;
  let models;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    await models.Facility.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.Setting.set('audit.changes.enabled', false);
  });

  afterAll(() => ctx.close());

  const createInvoicePaymentPrereqs = async () => {
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create({...fake(models.Department), facilityId: facility.id});
    const locationGroup = await models.LocationGroup.create({...fake(models.LocationGroup), facilityId: facility.id});
    const location = await models.Location.create({...fake(models.Location), facilityId: facility.id, locationGroupId: locationGroup.id});
    const patient = await models.Patient.create(fake(models.Patient));
    const clinician = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create({
      ...fake(models.Encounter),
      patientId: patient.id,
      examinerId: clinician.id,
      facilityId: facility.id,
      departmentId: department.id,
      locationId: location.id,
    });
    const invoice = await models.Invoice.create({
      ...fake(models.Invoice),
      encounterId: encounter.id,
    });
    return { invoice };
  };

  it('persists records when child references a not-yet-inserted parent via originalPaymentId', async () => {
    const { invoice } = await createInvoicePaymentPrereqs();

    const parentId = fakeUUID();
    const childId = fakeUUID();

    await sequelize.transaction(async transaction => {
      await withDeferredSyncSafeguards(sequelize, async () => {
        await sequelize.query(
          `INSERT INTO invoice_payments
            (id, invoice_id, date, receipt_number, amount, original_payment_id, created_at, updated_at)
          VALUES
            (:id, :invoiceId, CURRENT_DATE, 'RN-001', 100, :originalPaymentId, NOW(), NOW())`,
          {
            replacements: {
              id: childId,
              invoiceId: invoice.id,
              originalPaymentId: parentId,
            },
            transaction,
          },
        );

        await sequelize.query(
          `INSERT INTO invoice_payments
            (id, invoice_id, date, receipt_number, amount, created_at, updated_at)
          VALUES
            (:id, :invoiceId, CURRENT_DATE, 'RN-002', 200, NOW(), NOW())`,
          {
            replacements: {
              id: parentId,
              invoiceId: invoice.id,
            },
            transaction,
          },
        );
      });
    });

    const [results] = await sequelize.query(
      `SELECT id, original_payment_id FROM invoice_payments
       WHERE id IN (:parentId, :childId)
       ORDER BY id`,
      { replacements: { parentId, childId } },
    );
    expect(results).toHaveLength(2);

    const child = results.find(r => r.id === childId);
    expect(child.original_payment_id).toBe(parentId);
  });

  it('fails without deferred constraints when child is inserted before parent', async () => {
    const { invoice } = await createInvoicePaymentPrereqs();

    const parentId = fakeUUID();
    const childId = fakeUUID();

    await expect(
      sequelize.transaction(async transaction => {
        await sequelize.query(
          `INSERT INTO invoice_payments
            (id, invoice_id, date, receipt_number, amount, original_payment_id, created_at, updated_at)
          VALUES
            (:id, :invoiceId, CURRENT_DATE, 'RN-001', 100, :originalPaymentId, NOW(), NOW())`,
          {
            replacements: {
              id: childId,
              invoiceId: invoice.id,
              originalPaymentId: parentId,
            },
            transaction,
          },
        );
      }),
    ).rejects.toThrow(/foreign key/i);
  });

  it('throws if called outside a transaction', async () => {
    await expect(
      withDeferredSyncSafeguards(sequelize, async () => {}),
    ).rejects.toThrow('withDeferredSyncSafeguards must be called within a transaction');
  });
});
