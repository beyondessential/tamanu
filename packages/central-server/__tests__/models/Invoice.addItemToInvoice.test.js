import { fake } from '@tamanu/fake-data/fake';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { fakeUUID } from '@tamanu/utils/generateId';

import { createTestContext } from '../utilities';

// Covers TAM-7004: addItemToInvoice used to rely on InvoiceItem.upsert with explicit
// conflictFields, which Sequelize turns into an ON CONFLICT ... DO UPDATE — not
// possible once invoice_items_invoice_id_source_record_type_source_record_id_un is
// DEFERRABLE, since Postgres requires a non-deferrable arbiter for DO UPDATE. Rewritten
// as a find-then-update-or-create; these tests confirm that rewrite preserves the
// original upsert semantics (create once, update on repeat, restore if soft-deleted).
describe('Invoice.addItemToInvoice', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(() => ctx.close());

  const setup = async () => {
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
    await models.Invoice.create({
      ...fake(models.Invoice),
      encounterId: encounter.id,
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    const invoiceProduct = await models.InvoiceProduct.create(fake(models.InvoiceProduct));
    // addItemToInvoice only reads .getModelName() and .id off the source record, so an
    // unsaved instance is enough to stand in for a real Procedure/LabTest/etc row
    const sourceItem = models.Procedure.build({ id: fakeUUID() });

    return { encounter, invoiceProduct, sourceItem };
  };

  it('creates an invoice item when none exists for the source record', async () => {
    const { encounter, invoiceProduct, sourceItem } = await setup();

    await models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct, undefined, {
      quantity: 2,
      note: 'first pass',
    });

    const items = await models.InvoiceItem.findAll({
      where: { sourceRecordType: 'Procedure', sourceRecordId: sourceItem.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].note).toBe('first pass');
  });

  it('updates the existing invoice item on a repeat call instead of creating a duplicate', async () => {
    const { encounter, invoiceProduct, sourceItem } = await setup();

    await models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct, undefined, {
      quantity: 1,
      note: 'first pass',
    });
    await models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct, undefined, {
      quantity: 5,
      note: 'second pass',
    });

    const items = await models.InvoiceItem.findAll({
      where: { sourceRecordType: 'Procedure', sourceRecordId: sourceItem.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    expect(items[0].note).toBe('second pass');
  });

  it('restores a soft-deleted invoice item instead of creating a duplicate', async () => {
    const { encounter, invoiceProduct, sourceItem } = await setup();

    await models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct);
    const [item] = await models.InvoiceItem.findAll({
      where: { sourceRecordType: 'Procedure', sourceRecordId: sourceItem.id },
    });
    await item.destroy();

    await models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct, undefined, {
      quantity: 3,
    });

    const items = await models.InvoiceItem.findAll({
      where: { sourceRecordType: 'Procedure', sourceRecordId: sourceItem.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(item.id);
    expect(items[0].deletedAt).toBeNull();
    expect(items[0].quantity).toBe(3);
  });

  // The find-then-write in addItemToInvoice is a check-then-insert race if two calls for
  // the same (invoice, source record) pair run concurrently -- this happens in practice,
  // e.g. LabRequest/ImagingRequest afterUpdateHook fan out over Promise.all, so two
  // concurrent updates to the same request would race on the same invoice item. Guarded
  // by an advisory lock (see Invoice.ts); this proves that lock actually serialises
  // concurrent calls rather than letting the second one's create() throw.
  it('does not create a duplicate or throw when called concurrently for the same source record', async () => {
    const { encounter, invoiceProduct, sourceItem } = await setup();

    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        models.Invoice.addItemToInvoice(sourceItem, encounter.id, invoiceProduct, undefined, {
          quantity: i + 1,
        }),
      ),
    );

    const items = await models.InvoiceItem.findAll({
      where: { sourceRecordType: 'Procedure', sourceRecordId: sourceItem.id },
    });
    expect(items).toHaveLength(1);
  });
});
