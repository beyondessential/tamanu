import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { utils, writeFile } from 'xlsx';

import { fake } from '@tamanu/fake-data/fake';
import { tmpdir } from '@tamanu/shared/utils/tmpdir';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';

import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { insurancePlanPaymentImporter } from '../../app/admin/invoice/insurancePlanPaymentImporter';
import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';
import './matchers';

// each case builds its own invoice and writes a spreadsheet to disk
vi.setConfig({ testTimeout: 60000 });

// An invoice of three items at $100 each. Coverage is deliberately not a flat percentage of the
// total: the plan covers the first item at its own default, the second at a product-specific
// override, and the third not at all because the product is uninsurable. So the plan owes
// $80 + $50 + $0 = $130 of a $300 invoice, not 80% of $300.
const ITEM_PRICE = 100;
const PLAN_DEFAULT_COVERAGE = 80;
const PLAN_ITEM_COVERAGE = 50;
const PLAN_OWES = 130;

describe('Insurance plan payment import', () => {
  let ctx;
  let models;
  const filesToClean = [];

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await Promise.all(filesToClean.splice(0).map(file => rm(file, { force: true })));
  });

  const setupInvoice = async ({ status = INVOICE_STATUSES.FINALISED } = {}) => {
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
      status,
      insurancePlanPaymentStatus: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.UNPAID,
    });

    const plan = await models.InvoiceInsurancePlan.create(
      fake(models.InvoiceInsurancePlan, { defaultCoverage: PLAN_DEFAULT_COVERAGE }),
    );
    const otherPlan = await models.InvoiceInsurancePlan.create(
      fake(models.InvoiceInsurancePlan, { defaultCoverage: PLAN_DEFAULT_COVERAGE }),
    );
    await models.InvoicesInvoiceInsurancePlan.create({
      invoiceId: invoice.id,
      invoiceInsurancePlanId: plan.id,
    });

    const addItem = async ({ insurable, coverageValue }) => {
      const product = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, { insurable }),
      );
      if (coverageValue !== undefined) {
        await models.InvoiceInsurancePlanItem.create({
          invoiceInsurancePlanId: plan.id,
          invoiceProductId: product.id,
          coverageValue,
        });
      }
      await models.InvoiceItem.create({
        ...fake(models.InvoiceItem),
        invoiceId: invoice.id,
        productId: product.id,
        orderedByUserId: clinician.id,
        quantity: 1,
        priceFinal: ITEM_PRICE,
      });
    };

    await addItem({ insurable: true }); // covered at the plan's default: $80
    await addItem({ insurable: true, coverageValue: PLAN_ITEM_COVERAGE }); // overridden: $50
    await addItem({ insurable: false }); // not covered at all: $0

    return { invoice, plan, otherPlan, encounter };
  };

  const writeSheet = async rows => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.json_to_sheet(rows), 'Insurance Plan Payments');
    const file = path.join(await tmpdir(), `insurance-plan-payments-${randomUUID()}.xlsx`);
    writeFile(workbook, file);
    filesToClean.push(file);
    return file;
  };

  const doImport = (file, { checkPermission = () => true } = {}) =>
    importerTransaction({
      importer: insurancePlanPaymentImporter,
      file,
      models,
      checkPermission,
    });

  const paymentRow = ({ invoice, plan, ...overrides }) => ({
    id: randomUUID(),
    date: '2024-01-15',
    amount: 50,
    invoiceNumber: invoice.displayId,
    invoiceInsurancePlanId: plan.id,
    ...overrides,
  });

  const findPaymentsFor = invoice =>
    models.InvoiceInsurancePlanPayment.findAll({
      include: [{ model: models.InvoicePayment, as: 'detail', where: { invoiceId: invoice.id } }],
    });

  describe('recording payments', () => {
    it('records a payment against the invoice', async () => {
      const { invoice, plan } = await setupInvoice();
      const row = paymentRow({ invoice, plan, amount: 50 });

      const { errors, stats } = await doImport(await writeSheet([row]));

      expect(errors).toHaveLength(0);
      expect(stats).toMatchObject({
        InvoiceInsurancePlanPayment: { created: 1, updated: 0, errored: 0 },
      });

      const [payment] = await findPaymentsFor(invoice);
      expect(payment).toMatchObject({
        id: row.id,
        invoiceInsurancePlanId: plan.id,
        status: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL,
      });
      expect(Number(payment.detail.amount)).toEqual(50);
      expect(payment.detail.date).toEqual('2024-01-15');
      expect(payment.detail.receiptNumber).toMatch(/^[1-9A-HJ-NP-Z]{8}$/);

      await invoice.reload();
      expect(invoice.insurancePlanPaymentStatus).toEqual(
        INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL,
      );
    });

    it('marks the payment paid when it covers what the plan owes on the invoice items', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([paymentRow({ invoice, plan, amount: PLAN_OWES })]),
      );

      expect(errors).toHaveLength(0);
      const [payment] = await findPaymentsFor(invoice);
      expect(payment.status).toEqual(INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID);

      await invoice.reload();
      expect(invoice.insurancePlanPaymentStatus).toEqual(
        INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID,
      );
    });

    it('records a zero payment as rejected, with its reason', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([
          paymentRow({ invoice, plan, amount: 0, reason: 'Policy lapsed' }),
        ]),
      );

      expect(errors).toHaveLength(0);
      const [payment] = await findPaymentsFor(invoice);
      expect(payment).toMatchObject({
        status: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED,
        reason: 'Policy lapsed',
      });
    });
  });

  describe('validation', () => {
    const expectRejected = async (file, messageMatch) => {
      const { errors } = await doImport(file);
      expect(errors).not.toHaveLength(0);
      expect(errors.map(error => error.message ?? String(error)).join('\n')).toEqual(
        expect.stringMatching(messageMatch),
      );
    };

    it('rejects a payment for more than the plan owes on the invoice items', async () => {
      const { invoice, plan } = await setupInvoice();

      // The plan covers $130 of this $300 invoice. A flat 80% of the invoice total would allow
      // $240, so this row passing would mean the limit is no longer coverage-based.
      await expectRejected(
        await writeSheet([paymentRow({ invoice, plan, amount: PLAN_OWES + 1 })]),
        /exceeds the remaining balance of \$130/,
      );
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });

    it('accepts a payment for exactly what the plan owes', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([paymentRow({ invoice, plan, amount: PLAN_OWES })]),
      );

      expect(errors).toHaveLength(0);
    });

    it('rejects a plan that is not attached to the invoice', async () => {
      const { invoice, otherPlan } = await setupInvoice();

      await expectRejected(
        await writeSheet([paymentRow({ invoice, plan: otherPlan })]),
        /is not attached to invoice/,
      );
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });

    it('rejects an invoice that is not finalised', async () => {
      const { invoice, plan } = await setupInvoice({ status: INVOICE_STATUSES.IN_PROGRESS });

      await expectRejected(
        await writeSheet([paymentRow({ invoice, plan })]),
        /must be finalised/,
      );
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });

    it('rejects an unknown invoice number', async () => {
      const { invoice, plan } = await setupInvoice();

      await expectRejected(
        await writeSheet([
          paymentRow({ invoice, plan, invoiceNumber: 'NOT-AN-INVOICE' }),
        ]),
        /Invoice 'NOT-AN-INVOICE' not found/,
      );
    });

    it('rolls the whole file back when any row fails', async () => {
      const { invoice, plan, otherPlan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([
          paymentRow({ invoice, plan, amount: 10 }),
          paymentRow({ invoice, plan: otherPlan, amount: 10 }), // plan not attached
        ]),
      );

      expect(errors).toHaveLength(1);
      // the import is one transaction, so the valid row is rolled back along with the bad one
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });
  });

  describe('updating a payment', () => {
    it('updates the existing payment rather than adding a second one', async () => {
      const { invoice, plan } = await setupInvoice();
      const row = paymentRow({ invoice, plan, amount: 50 });

      await doImport(await writeSheet([row]));
      const [created] = await findPaymentsFor(invoice);

      const { errors, stats } = await doImport(
        await writeSheet([{ ...row, amount: PLAN_OWES, reason: 'Reassessed' }]),
      );

      expect(errors).toHaveLength(0);
      expect(stats).toMatchObject({
        InvoiceInsurancePlanPayment: { created: 0, updated: 1, errored: 0 },
      });

      const payments = await findPaymentsFor(invoice);
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({
        id: row.id,
        reason: 'Reassessed',
        status: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID,
      });
      expect(Number(payments[0].detail.amount)).toEqual(PLAN_OWES);
      // the receipt number belongs to the original payment and is not reissued on an update
      expect(payments[0].detail.receiptNumber).toEqual(created.detail.receiptNumber);
    });

    it('lets a payment grow into the balance its own earlier amount was using', async () => {
      const { invoice, plan } = await setupInvoice();
      const row = paymentRow({ invoice, plan, amount: 50 });

      await doImport(await writeSheet([row]));
      // without crediting the existing $50 back, $130 would read as $50 over the balance
      const { errors } = await doImport(await writeSheet([{ ...row, amount: PLAN_OWES }]));

      expect(errors).toHaveLength(0);
    });

    it('refuses to move a payment that belongs to another invoice', async () => {
      const first = await setupInvoice();
      const second = await setupInvoice();
      const row = paymentRow({ invoice: first.invoice, plan: first.plan, amount: 50 });

      await doImport(await writeSheet([row]));

      const { errors } = await doImport(
        await writeSheet([
          { ...row, invoiceNumber: second.invoice.displayId, invoiceInsurancePlanId: second.plan.id },
        ]),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toEqual(expect.stringMatching(/already exists on a different invoice/));
      expect(await findPaymentsFor(second.invoice)).toHaveLength(0);
      expect(await findPaymentsFor(first.invoice)).toHaveLength(1);
    });
  });

  describe('permissions', () => {
    const importOverHttp = async (app, file) =>
      app.post('/v1/admin/import/insurancePlanPayments').attach('file', file);

    afterEach(async () => {
      await models.Permission.destroy({ where: {}, force: true });
      await models.Role.destroy({ where: {}, force: true });
    });

    it('forbids the import without permission to create invoice payments', async () => {
      const { invoice, plan } = await setupInvoice();
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'read', noun: 'InvoicePayment' },
      ]);
      const app = await ctx.baseApp.asRole('practitioner');

      const result = await importOverHttp(app, await writeSheet([paymentRow({ invoice, plan })]));

      expect(result.body.didntSendReason).toEqual('validationFailed');
      expect(JSON.stringify(result.body.errors)).toEqual(
        expect.stringMatching(/No permission to perform action “create” on “InvoicePayment”/),
      );
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });

    it('allows creating a payment with create permission alone', async () => {
      const { invoice, plan } = await setupInvoice();
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'create', noun: 'InvoicePayment' },
      ]);
      const app = await ctx.baseApp.asRole('practitioner');

      const result = await importOverHttp(app, await writeSheet([paymentRow({ invoice, plan })]));

      expect(result.body.errors).toHaveLength(0);
      expect(await findPaymentsFor(invoice)).toHaveLength(1);
    });

    it('forbids updating an existing payment without write permission', async () => {
      const { invoice, plan } = await setupInvoice();
      const row = paymentRow({ invoice, plan, amount: 50 });
      await doImport(await writeSheet([row]));

      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'create', noun: 'InvoicePayment' },
      ]);
      const app = await ctx.baseApp.asRole('practitioner');

      const result = await importOverHttp(app, await writeSheet([{ ...row, amount: 60 }]));

      expect(result.body.didntSendReason).toEqual('validationFailed');
      expect(JSON.stringify(result.body.errors)).toEqual(
        expect.stringMatching(/No permission to perform action “write” on “InvoicePayment”/),
      );

      const [payment] = await findPaymentsFor(invoice);
      expect(Number(payment.detail.amount)).toEqual(50);
    });
  });

  describe('dates', () => {
    // SheetJS hands back a date cell as a Date at local midnight. Formatting that through
    // toISOString() stores the previous day anywhere east of UTC, which is every Pacific
    // deployment, so the timezone has to be pinned for this to test anything.
    const originalTimezone = process.env.TZ;

    beforeAll(() => {
      process.env.TZ = 'Pacific/Auckland';
    });

    afterAll(() => {
      process.env.TZ = originalTimezone;
    });

    it('stores the day shown in the spreadsheet for a date cell', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([paymentRow({ invoice, plan, date: new Date(2024, 0, 15) })]),
      );

      expect(errors).toHaveLength(0);
      const [payment] = await findPaymentsFor(invoice);
      expect(payment.detail.date).toEqual('2024-01-15');
    });

    it('stores the day shown in the spreadsheet for a text cell', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([paymentRow({ invoice, plan, date: '2024-01-15' })]),
      );

      expect(errors).toHaveLength(0);
      const [payment] = await findPaymentsFor(invoice);
      expect(payment.detail.date).toEqual('2024-01-15');
    });

    it('rejects an ambiguous date rather than guessing at it', async () => {
      const { invoice, plan } = await setupInvoice();

      const { errors } = await doImport(
        await writeSheet([paymentRow({ invoice, plan, date: '15/01/2024' })]),
      );

      expect(errors).toHaveLength(1);
      expect(await findPaymentsFor(invoice)).toHaveLength(0);
    });
  });
});
