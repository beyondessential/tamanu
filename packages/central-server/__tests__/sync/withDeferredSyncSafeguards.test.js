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
    const department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    const locationGroup = await models.LocationGroup.create({
      ...fake(models.LocationGroup),
      facilityId: facility.id,
    });
    const location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
      locationGroupId: locationGroup.id,
    });
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

    await sequelize.transaction(async () => {
      await withDeferredSyncSafeguards(sequelize, async () => {
        // Insert child first (references parent that doesn't exist yet)
        await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            id: childId,
            invoiceId: invoice.id,
            originalPaymentId: parentId,
          }),
        );

        // Then insert the parent
        await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            id: parentId,
            invoiceId: invoice.id,
          }),
        );
      });
    });

    const child = await models.InvoicePayment.findByPk(childId);
    expect(child.originalPaymentId).toBe(parentId);
  });

  it('fails without deferred constraints when child is inserted before parent', async () => {
    const { invoice } = await createInvoicePaymentPrereqs();

    const parentId = fakeUUID();

    await expect(
      sequelize.transaction(async () => {
        await models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: invoice.id,
            originalPaymentId: parentId,
          }),
        );
      }),
    ).rejects.toThrow(/foreign key/i);
  });

  it('throws if called outside a transaction', async () => {
    await expect(withDeferredSyncSafeguards(sequelize, async () => {})).rejects.toThrow(
      'withDeferredSyncSafeguards must be called within a transaction',
    );
  });

  it('resets constraints to immediate after the callback fails with a JS error', async () => {
    const { invoice } = await createInvoicePaymentPrereqs();

    const parentId = fakeUUID();

    await sequelize.transaction(async () => {
      // The original JS error should propagate, not a "current transaction is aborted" error
      const error = await withDeferredSyncSafeguards(sequelize, async () => {
        throw new Error('simulated failure');
      }).catch(e => e);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('simulated failure');

      // Constraints should be back to IMMEDIATE, so inserting a child referencing
      // a non-existent parent should fail right away with a FK violation
      await expect(
        models.InvoicePayment.create(
          fake(models.InvoicePayment, {
            invoiceId: invoice.id,
            originalPaymentId: parentId,
          }),
        ),
      ).rejects.toThrow(/foreign key/i);
    });
  });

  it('propagates the original database error when operation fails with a DB error', async () => {
    await createInvoicePaymentPrereqs();

    const nonExistentInvoiceId = fakeUUID();
    let operationCompleted = false;

    await expect(
      sequelize.transaction(async () => {
        await withDeferredSyncSafeguards(sequelize, async () => {
          // This will fail immediately with a FK violation (invoiceId references
          // a non-existent invoice). The error should propagate as-is, not be
          // replaced by a "current transaction is aborted" error.
          await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: nonExistentInvoiceId,
            }),
          );
          operationCompleted = true;
        });
      }),
    ).rejects.toThrow(/foreign key/i);

    // The operation failed with a foreign key violation -- the FK error came from
    // operation() itself, not from SET CONSTRAINTS ALL IMMEDIATE.
    expect(operationCompleted).toBe(false);
  });

  it('throws FK violation when operation succeeds but deferred constraints are violated', async () => {
    const { invoice } = await createInvoicePaymentPrereqs();

    const nonExistentParentId = fakeUUID();
    let operationCompleted = false;

    await expect(
      sequelize.transaction(async () => {
        await withDeferredSyncSafeguards(sequelize, async () => {
          // Insert a child referencing a parent that will never be inserted.
          // The deferrable FK allows the insert to succeed, but SET CONSTRAINTS
          // ALL IMMEDIATE (on the success path) must catch the violation.
          await models.InvoicePayment.create(
            fake(models.InvoicePayment, {
              invoiceId: invoice.id,
              originalPaymentId: nonExistentParentId,
            }),
          );
          operationCompleted = true;
        });
      }),
    ).rejects.toThrow(/foreign key/i);

    // The operation ran to completion -- the FK error came from
    // SET CONSTRAINTS ALL IMMEDIATE, not from the insert itself
    expect(operationCompleted).toBe(true);
  });
});
