import { sub } from 'date-fns';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  ENCOUNTER_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
} from '@tamanu/constants';

import { BedFeeCharger } from '../../app/tasks/BedFeeCharger';
import { createTestContext } from '../utilities';

describe('BedFeeCharger', () => {
  let ctx;
  let models;
  let patient;
  let examiner;
  let department;
  let location;
  let bedProduct;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    patient = await models.Patient.create(fake(models.Patient));
    examiner = await models.User.create(fakeUser());
    const facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
    bedProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: location.id,
      }),
    );
  });

  afterAll(() => ctx.close());

  const createAdmission = () =>
    models.Encounter.create({
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      examinerId: examiner.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: toDateTimeString(sub(new Date(), { days: 1 })),
    });

  const createInvoice = encounterId =>
    models.Invoice.create({
      encounterId,
      displayId: `INV-${encounterId.slice(0, 8)}`,
      date: toDateTimeString(sub(new Date(), { days: 1 })),
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

  it('still charges healthy encounters when one encounter has corrupt invoice data', async () => {
    // Poison record: two in-progress invoices makes recalculateBedFee throw for this encounter.
    // The run must contain the failure rather than aborting (which would starve every encounter
    // after it in scan order, every hour).
    const poisoned = await createAdmission();
    await createInvoice(poisoned.id);
    await createInvoice(poisoned.id);

    const healthy = await createAdmission();
    const healthyInvoice = await createInvoice(healthy.id);

    const charger = new BedFeeCharger(ctx);
    await charger.run(); // a rejection here fails the test

    const items = await models.InvoiceItem.findAll({ where: { invoiceId: healthyInvoice.id } });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProduct.id);
    expect(items[0].quantity).toBeGreaterThanOrEqual(1);
  });
});
