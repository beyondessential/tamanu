import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import config from 'config';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { getCurrentDateTimeString, storedDateTimeToEpochMilliseconds } from '@tamanu/utils/dateTime';
import { ReadSettings } from '@tamanu/settings';
import {
  ENCOUNTER_TYPES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import { createTestContext } from '../utilities';

// Model-level integration for the inpatient bed fee (TAM-6900): Invoice.recalculateBedFee charges
// one night per facility-local overnight check (min the admission night), per Location, and skips
// a location with no bed-fee product (e.g. an "open ward" placeholder).
describe('Bed fee (Invoice.recalculateBedFee)', () => {
  let ctx;
  let models;
  let patient;
  let user;
  let facility;
  let department;
  let bedLocation;
  let placeholderLocation;
  let bedProduct;
  let settings;
  let primaryTimeZone;

  const admitAndRecompute = async ({ locationId, startDate, endDate }) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate,
      endDate,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: startDate,
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    return models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
  };

  // recalculateBedFee reconstructs location history from the audit changelog (logs.changes).
  // These helpers stand in for the encounter writes that would populate it: clear the rows the
  // always-on trigger wrote when the encounter was created, then record a location as of a given
  // (write-)time, so a test controls the timeline the same way it used to with EncounterHistory.
  // `at` is a primary-tz wall-clock string, stored as the real absolute instant the trigger would
  // write (a timestamptz), so the test exercises the same instant→primary-tz conversion as prod.
  const clearEncounterChangelog = encounterId =>
    models.ChangeLog.destroy({ where: { recordId: encounterId } });
  const recordLocationAt = (encounterId, locationId, at) => {
    const instant = new Date(storedDateTimeToEpochMilliseconds(at, primaryTimeZone));
    return models.ChangeLog.create({
      tableOid: 0,
      tableSchema: 'public',
      tableName: 'encounters',
      loggedAt: instant,
      updatedByUserId: user.id,
      recordId: encounterId,
      recordCreatedAt: instant,
      recordUpdatedAt: instant,
      recordData: { location_id: locationId },
      deviceId: 'test',
      version: 'test',
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    primaryTimeZone = getPrimaryTimeZone(config);

    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    facility = await models.Facility.findOne({ order: [['createdAt', 'ASC']] });
    settings = new ReadSettings(models, facility.id);

    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id, code: 'BED-DEPT' }),
    );
    bedLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC' }),
    );
    placeholderLocation = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-PLACEHOLDER' }),
    );

    // Bed-fee product for the real bed only; the placeholder ward has none.
    bedProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: bedLocation.id,
      }),
    );
    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Bed fee facility list',
        code: 'BED-FEE-PL',
        rules: { facilityId: facility.id },
      }),
    );
    await models.InvoicePriceListItem.create(
      fake(models.InvoicePriceListItem, {
        invoiceProductId: bedProduct.id,
        invoicePriceListId: priceList.id,
        price: 200,
        isHidden: false,
      }),
    );
  });

  afterAll(() => ctx.close());

  it('charges one night for a same-day admission', async () => {
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 09:00:00',
      endDate: '2024-06-16 14:00:00',
    });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProduct.id);
    expect(items[0].quantity).toBe(1);
  });

  it('charges one night per overnight check for a multi-night stay', async () => {
    // Admitted Sun 18:00, discharged Wed 06:00 → 3 overnight (02:00) checks → 3 nights.
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProduct.id);
    expect(items[0].quantity).toBe(3);
  });

  it('does not charge a location with no bed-fee product (placeholder ward)', async () => {
    const items = await admitAndRecompute({
      locationId: placeholderLocation.id,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    expect(items).toHaveLength(0);
  });

  it('bills per location when the patient changes ward mid-stay', async () => {
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-B' }),
    );
    const bedProductB = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: bedLocation.id,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: '2024-06-16 18:00:00',
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

    // Location history: bed A from admission, moved to bed B mid-day on the 17th.
    await clearEncounterChangelog(encounter.id);
    await recordLocationAt(encounter.id, bedLocation.id, '2024-06-16 18:00:00');
    await recordLocationAt(encounter.id, locationB.id, '2024-06-17 12:00:00');

    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    const nightsByProduct = Object.fromEntries(items.map(item => [item.productId, item.quantity]));
    // Overnight (02:00) checks: 17th → bed A, 18th + 19th → bed B.
    expect(items).toHaveLength(2);
    expect(nightsByProduct[bedProduct.id]).toBe(1);
    expect(nightsByProduct[bedProductB.id]).toBe(2);
  });

  it('bills a ward move recomputed in the same transaction, before the changelog trigger fires', async () => {
    // The audit changelog trigger is deferred to commit, so a recompute run in the same transaction
    // as a ward move (as the encounter route does) can't see that move's changelog row yet. The
    // recompute must still bill the new location — from the encounter's live location, not the
    // stale changelog — rather than waiting for the next nightly charger.
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-MOVE-TXN' }),
    );
    const bedProductB = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    // Admitted to bed A and still admitted (endDate null) — committed, so its changelog row exists.
    const startDate = getCurrentDateTimeString();
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: bedLocation.id,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate,
      endDate: null,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: startDate,
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

    await models.Invoice.sequelize.transaction(async () => {
      await encounter.update({ locationId: locationB.id });
      await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    });

    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    const nightsByProduct = Object.fromEntries(items.map(item => [item.productId, item.quantity]));
    expect(nightsByProduct[bedProductB.id]).toBe(1); // the just-made move is billed immediately
    expect(nightsByProduct[bedProduct.id] ?? 0).toBe(0); // bed A no longer qualifies
  });

  it('bills the admission ward for backdated-admission nights recorded before a later ward move', async () => {
    // Admitted to bed A at 22:00 on the 16th, but only recorded in Tamanu at 09:00 on the 17th —
    // after that night's 02:00 check — then moved to bed B at 12:00 the same day. The admission
    // takes effect from startDate, not the (later) data-entry time, so the 17th night is bed A's
    // even though the changelog row was written after the check and the current location is bed B.
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-BACKDATED' }),
    );
    const bedProductB = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: locationB.id, // current location after the move
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-16 22:00:00',
      endDate: '2024-06-18 06:00:00',
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: '2024-06-16 22:00:00',
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

    // Admission to bed A recorded late (09:00 on the 17th), then moved to bed B at 12:00.
    await clearEncounterChangelog(encounter.id);
    await recordLocationAt(encounter.id, bedLocation.id, '2024-06-17 09:00:00');
    await recordLocationAt(encounter.id, locationB.id, '2024-06-17 12:00:00');

    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    const nightsByProduct = Object.fromEntries(items.map(item => [item.productId, item.quantity]));
    // Overnight (02:00) checks: 17th → bed A (admission night), 18th → bed B.
    expect(items).toHaveLength(2);
    expect(nightsByProduct[bedProduct.id]).toBe(1);
    expect(nightsByProduct[bedProductB.id]).toBe(1);
  });

  it('charges the minimum-one-night to the current location after an early ward move (before any check)', async () => {
    // Admitted to bed A at 09:00, moved to bed B at 11:00, discharged 14:00 the same day — no 02:00
    // check is crossed, so the minimum-one-night falls back to the location at the end of the stay (B).
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-EARLY' }),
    );
    const bedProductB = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: locationB.id, // current location after the move
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-16 09:00:00',
      endDate: '2024-06-16 14:00:00',
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: '2024-06-16 09:00:00',
      status: INVOICE_STATUSES.IN_PROGRESS,
    });

    // Bed A from admission, moved to bed B at 11:00 — both before the next 02:00 check.
    await clearEncounterChangelog(encounter.id);
    await recordLocationAt(encounter.id, bedLocation.id, '2024-06-16 09:00:00');
    await recordLocationAt(encounter.id, locationB.id, '2024-06-16 11:00:00');

    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(bedProductB.id); // current location, not the admission bed
    expect(items[0].quantity).toBe(1);
  });

  it('zeroes a departed location instead of deleting, and recharges it when the patient returns', async () => {
    const locationB = await models.Location.create(
      fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-RETURN' }),
    );
    await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
        sourceRecordId: locationB.id,
      }),
    );

    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      locationId: bedLocation.id,
      departmentId: department.id,
      examinerId: user.id,
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      startDate: '2024-06-16 09:00:00',
      endDate: '2024-06-16 14:00:00',
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${encounter.id.slice(0, 8)}`,
      date: '2024-06-16 09:00:00',
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    const addHistory = (locationId, date) => recordLocationAt(encounter.id, locationId, date);

    await clearEncounterChangelog(encounter.id);
    // Admitted to bed A; same-day stay → minimum-one-night charged to A.
    await addHistory(bedLocation.id, '2024-06-16 09:00:00');
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    const itemA = await models.InvoiceItem.findOne({
      where: { invoiceId: invoice.id, sourceRecordId: bedLocation.id },
    });
    expect(itemA.quantity).toBe(1);

    // Moved to bed B before any overnight check → A no longer qualifies: zeroed, not deleted.
    await addHistory(locationB.id, '2024-06-16 11:00:00');
    await encounter.update({ locationId: locationB.id });
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    await itemA.reload();
    expect(itemA.quantity).toBe(0);
    const itemB = await models.InvoiceItem.findOne({
      where: { invoiceId: invoice.id, sourceRecordId: locationB.id },
    });
    expect(itemB.quantity).toBe(1);

    // Returned to bed A and crossed the 02:00 check there → the same line is recharged.
    await addHistory(bedLocation.id, '2024-06-16 13:00:00');
    await encounter.update({ locationId: bedLocation.id, endDate: '2024-06-17 06:00:00' });
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);
    await itemA.reload();
    expect(itemA.quantity).toBe(1);
    await itemB.reload();
    expect(itemB.quantity).toBe(0);
  });

  it('does not resurrect a line the cashier removed', async () => {
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 18:00:00',
      endDate: '2024-06-19 06:00:00',
    });
    const item = items[0];
    await item.destroy(); // cashier removes the line (soft delete)

    const invoice = await models.Invoice.findByPk(item.invoiceId);
    const encounter = await models.Encounter.findByPk(invoice.encounterId);
    await models.Invoice.recalculateBedFee(encounter, settings, primaryTimeZone);

    const liveItems = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
    expect(liveItems).toHaveLength(0);
    const removed = await models.InvoiceItem.findByPk(item.id, { paranoid: false });
    expect(removed.deletedAt).toBeTruthy();
  });

  it('loads the bed-fee product source location in the invoice include', async () => {
    // Regression: the invoice-response include must eager-load the Location source record, or the
    // bed-fee line resolves no product code (and nothing in views that render via the source record).
    const items = await admitAndRecompute({
      locationId: bedLocation.id,
      startDate: '2024-06-16 09:00:00',
      endDate: '2024-06-16 14:00:00',
    });
    const invoice = await models.Invoice.findByPk(items[0].invoiceId, {
      include: models.Invoice.getFullReferenceAssociations(),
    });
    const bedItem = invoice.items.find(item => item.productId === bedProduct.id);
    expect(bedItem.product.sourceLocationRecord).toBeTruthy();
    expect(bedItem.product.getProductCode()).toBe(bedLocation.code);
  });

  describe('invoice routes with bed-fee lines', () => {
    let app;

    beforeAll(async () => {
      app = await ctx.baseApp.asRole('practitioner');
    });

    it('removes quantity-0 bed-fee lines at finalisation and keeps charged ones', async () => {
      const zeroedLocation = await models.Location.create(
        fake(models.Location, { facilityId: facility.id, code: 'BED-LOC-ZEROED' }),
      );
      const zeroedProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
          sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE],
          sourceRecordId: zeroedLocation.id,
        }),
      );

      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
        locationId: bedLocation.id,
        departmentId: department.id,
        examinerId: user.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: '2024-06-16 18:00:00',
        endDate: '2024-06-17 06:00:00', // discharged, so the invoice can be finalised
      });
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: `INV-${encounter.id.slice(0, 8)}`,
        date: '2024-06-16 18:00:00',
        status: INVOICE_STATUSES.IN_PROGRESS,
      });
      const createBedFeeItem = (locationId, productId, quantity) =>
        models.InvoiceItem.create({
          invoiceId: invoice.id,
          sourceRecordType: 'Location',
          sourceRecordId: locationId,
          productId,
          orderedByUserId: user.id,
          orderDate: '2024-06-16',
          quantity,
        });
      const chargedItem = await createBedFeeItem(bedLocation.id, bedProduct.id, 1);
      const zeroedItem = await createBedFeeItem(zeroedLocation.id, zeroedProduct.id, 0);

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);
      expect(result).toHaveSucceeded();

      const removed = await models.InvoiceItem.findByPk(zeroedItem.id, { paranoid: false });
      expect(removed.deletedAt).toBeTruthy();
      const kept = await models.InvoiceItem.findByPk(chargedItem.id);
      expect(kept).toBeTruthy();
      expect(kept.productNameFinal).toBe(bedProduct.name);
    });
  });
});
