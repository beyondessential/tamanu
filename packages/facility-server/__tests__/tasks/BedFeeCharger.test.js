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
import { getServerFacilityIds } from '../../app/serverConfig';
import { createTestContext } from '../utilities';

jest.mock('../../app/serverConfig', () => ({
  ...jest.requireActual('../../app/serverConfig'),
  getServerFacilityIds: jest.fn(),
}));

describe('BedFeeCharger', () => {
  let ctx;
  let models;
  let patient;
  let examiner;
  let facility;
  let otherFacility;
  let department;
  let location;
  let otherLocation;
  let bedProduct;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;

    patient = await models.Patient.create(fake(models.Patient));
    examiner = await models.User.create(fakeUser());
    facility = await models.Facility.create(fake(models.Facility));
    otherFacility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    location = await models.Location.create({ ...fake(models.Location), facilityId: facility.id });
    otherLocation = await models.Location.create({
      ...fake(models.Location),
      facilityId: otherFacility.id,
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

  const createAdmission = (locationId = location.id) =>
    models.Encounter.create({
      patientId: patient.id,
      departmentId: department.id,
      locationId,
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
    getServerFacilityIds.mockReturnValue([facility.id]);

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

  it('does not charge an admission belonging to another facility', async () => {
    // The encounter's location is at a facility this server does not own, so it must be left to
    // that facility's own server — charging it here would double-write across servers.
    getServerFacilityIds.mockReturnValue([facility.id]);

    const foreign = await createAdmission(otherLocation.id);
    const foreignInvoice = await createInvoice(foreign.id);

    const charger = new BedFeeCharger(ctx);
    await charger.run();

    const items = await models.InvoiceItem.findAll({ where: { invoiceId: foreignInvoice.id } });
    expect(items).toHaveLength(0);
  });
});
