import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  ENCOUNTER_TYPES,
  INVOICE_STATUSES,
  PATIENT_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { generateReceiptNumber } from '@tamanu/utils/invoice';

import { createTestContext } from '../utilities';

// Coverage follows the section a plan is attached to, so the invoice the web reads and the amount
// the patient is held to both have to be scoped section by section rather than invoice-wide.
describe('Insurance across invoice sections', () => {
  let ctx;
  let models;
  let app;
  let user;
  let patient;
  let department;
  let location;
  let paymentMethod;
  let insurableProduct;
  let emergencySection;
  let inpatientSection;
  let plan;
  let otherPlan;

  // Each plan covers the product at 50%, so an item priced at 100 leaves the patient 50 where it
  // is covered and the whole 100 where it is not.
  const ITEM_PRICE = 100;
  const COVERED_SHARE = 50;

  const createPlan = async code => {
    const created = await models.InvoiceInsurancePlan.create(
      fake(models.InvoiceInsurancePlan, { code, defaultCoverage: 50 }),
    );
    await models.InvoiceInsurancePlanItem.create({
      invoiceInsurancePlanId: created.id,
      invoiceProductId: insurableProduct.id,
      coverageValue: 50,
    });
    return created;
  };

  const createInvoice = async (status = INVOICE_STATUSES.FINALISED) => {
    const encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: user.id,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        endDate: null,
      }),
    );
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${crypto.randomUUID().slice(0, 8)}`,
      date: new Date(),
      status,
    });
    return { encounter, invoice };
  };

  const addItem = (invoiceId, invoiceSectionId) =>
    models.InvoiceItem.create(
      fake(models.InvoiceItem, {
        id: crypto.randomUUID(),
        invoiceId,
        productId: insurableProduct.id,
        quantity: 1,
        priceFinal: ITEM_PRICE,
        orderedByUserId: user.id,
        invoiceSectionId,
      }),
    );

  const attach = (invoiceId, insurancePlan, invoiceSectionId = null) =>
    models.InvoicesInvoiceInsurancePlan.create({
      invoiceId,
      invoiceInsurancePlanId: insurancePlan.id,
      invoiceSectionId,
    });

  const fetchInvoice = async encounterId =>
    (await app.get(`/api/encounter/${encounterId}/invoice`)).body;

  const planIdsCovering = (invoice, itemId) =>
    invoice.items
      .find(item => item.id === itemId)
      .insurancePlanItems.map(planItem => planItem.id)
      .sort();

  const payFromPatient = (invoiceId, amount) =>
    app.post(`/api/invoices/${invoiceId}/patientPayments`).send({
      date: '2024-01-15',
      amount,
      receiptNumber: generateReceiptNumber(),
      methodId: paymentMethod.id,
    });

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    const facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    location = await models.Location.create(fake(models.Location, { facilityId: facility.id }));
    paymentMethod = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.PAYMENT_METHOD, code: 'SECTION-CASH' }),
    );
    insurableProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, { insurable: true }),
    );
    [emergencySection, inpatientSection] = await Promise.all(
      [PATIENT_STATUSES.EMERGENCY, PATIENT_STATUSES.INPATIENT].map(code =>
        models.ReferenceData.create(
          fake(models.ReferenceData, { type: REFERENCE_TYPES.INVOICE_SECTION, code }),
        ),
      ),
    );
    plan = await createPlan('SECTION-PLAN');
    otherPlan = await createPlan('SECTION-PLAN-2');
    app = await ctx.baseApp.asUser(user);
  });

  beforeEach(async () => {
    const tablesToClean = ['Invoice', 'InvoicePayment', 'InvoicePatientPayment'];
    await Promise.all(tablesToClean.map(table => models[table].truncate({ cascade: true })));
  });

  afterAll(() => ctx.close());

  describe('the invoice the web reads', () => {
    it('covers one section with the plan attached to it and leaves the other alone', async () => {
      const { encounter, invoice } = await createInvoice();
      const emergencyItem = await addItem(invoice.id, emergencySection.id);
      const inpatientItem = await addItem(invoice.id, inpatientSection.id);
      await attach(invoice.id, plan, emergencySection.id);

      const body = await fetchInvoice(encounter.id);

      expect(planIdsCovering(body, emergencyItem.id)).toEqual([plan.id]);
      expect(planIdsCovering(body, inpatientItem.id)).toEqual([]);
    });

    it('covers every item, sectioned or not, with a plan attached to no section', async () => {
      const { encounter, invoice } = await createInvoice();
      const emergencyItem = await addItem(invoice.id, emergencySection.id);
      const unsectionedItem = await addItem(invoice.id, null);
      await attach(invoice.id, plan);

      const body = await fetchInvoice(encounter.id);

      expect(planIdsCovering(body, emergencyItem.id)).toEqual([plan.id]);
      expect(planIdsCovering(body, unsectionedItem.id)).toEqual([plan.id]);
    });

    it('gives each section only its own plan where the two sections differ', async () => {
      const { encounter, invoice } = await createInvoice();
      const emergencyItem = await addItem(invoice.id, emergencySection.id);
      const inpatientItem = await addItem(invoice.id, inpatientSection.id);
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, otherPlan, inpatientSection.id);

      const body = await fetchInvoice(encounter.id);

      expect(planIdsCovering(body, emergencyItem.id)).toEqual([plan.id]);
      expect(planIdsCovering(body, inpatientItem.id)).toEqual([otherPlan.id]);
    });

    it('carries the section each attachment covers', async () => {
      const { encounter, invoice } = await createInvoice();
      await addItem(invoice.id, emergencySection.id);
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, plan, inpatientSection.id);

      const body = await fetchInvoice(encounter.id);

      expect(body.insurancePlans).toHaveLength(2);
      expect(body.insurancePlans.map(attached => attached.invoiceSectionId).sort()).toEqual(
        [emergencySection.id, inpatientSection.id].sort(),
      );
      // A plan on two sections is two lots of coverage, so each attachment is told apart
      expect(new Set(body.insurancePlans.map(attached => attached.attachmentId)).size).toBe(2);
    });
  });

  describe('the coverage preview for a new item', () => {
    const previewFor = (encounterId, invoiceSectionId) =>
      app.get('/api/invoices/insurance-plan-items').query({
        encounterId,
        productId: insurableProduct.id,
        ...(invoiceSectionId ? { invoiceSectionId } : {}),
      });

    it("offers the plans covering the row's own section", async () => {
      const { encounter, invoice } = await createInvoice();
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, otherPlan, inpatientSection.id);

      const result = await previewFor(encounter.id, emergencySection.id);

      expect(result).toHaveSucceeded();
      expect(result.body.map(entry => entry.id)).toEqual([plan.id]);
    });

    it('offers a plan covering the whole invoice to every section', async () => {
      const { encounter, invoice } = await createInvoice();
      await attach(invoice.id, plan);

      const result = await previewFor(encounter.id, inpatientSection.id);

      expect(result).toHaveSucceeded();
      expect(result.body.map(entry => entry.id)).toEqual([plan.id]);
    });

    it('offers a row in no section only the plans covering the whole invoice', async () => {
      const { encounter, invoice } = await createInvoice();
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, otherPlan);

      const result = await previewFor(encounter.id, null);

      expect(result).toHaveSucceeded();
      expect(result.body.map(entry => entry.id)).toEqual([otherPlan.id]);
    });

    it('refuses a section id repeated or bracketed in the query string', async () => {
      const { encounter, invoice } = await createInvoice();
      await attach(invoice.id, plan, emergencySection.id);

      const repeated = await app.get(
        `/api/invoices/insurance-plan-items?encounterId=${encounter.id}` +
          `&productId=${insurableProduct.id}` +
          `&invoiceSectionId=${emergencySection.id}&invoiceSectionId=${inpatientSection.id}`,
      );
      expect(repeated).toHaveRequestError();

      const bracketed = await app.get(
        `/api/invoices/insurance-plan-items?encounterId=${encounter.id}` +
          `&productId=${insurableProduct.id}&invoiceSectionId[x]=1`,
      );
      expect(bracketed).toHaveRequestError();
    });

    it('names a plan reaching the row through two attachments once', async () => {
      const { encounter, invoice } = await createInvoice();
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, plan, inpatientSection.id);

      const result = await previewFor(encounter.id, emergencySection.id);

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
    });
  });

  describe('reading the preview', () => {
    it('refuses a request carrying no session', async () => {
      const { encounter } = await createInvoice();

      const result = await ctx.baseApp.get('/api/invoices/insurance-plan-items').query({
        encounterId: encounter.id,
        productId: insurableProduct.id,
      });

      expect(result).toHaveRequestError();
    });

    it('refuses a user without read access to invoices', async () => {
      const { encounter } = await createInvoice();
      const readOnlyApp = await ctx.baseApp.asRole('base');

      const result = await readOnlyApp.get('/api/invoices/insurance-plan-items').query({
        encounterId: encounter.id,
        productId: insurableProduct.id,
      });

      expect(result).toBeForbidden();
    });
  });

  describe('what the patient is held to', () => {
    it('leaves the uncovered section wholly to the patient', async () => {
      const { invoice } = await createInvoice();
      await addItem(invoice.id, emergencySection.id);
      await addItem(invoice.id, inpatientSection.id);
      await attach(invoice.id, plan, emergencySection.id);

      const owed = COVERED_SHARE + ITEM_PRICE;
      expect(await payFromPatient(invoice.id, owed + 0.01)).toBeForbidden();
      expect(await payFromPatient(invoice.id, owed)).toHaveSucceeded();
    });

    it('counts the same plan on two sections as coverage of each', async () => {
      const { invoice } = await createInvoice();
      await addItem(invoice.id, emergencySection.id);
      await addItem(invoice.id, inpatientSection.id);
      await attach(invoice.id, plan, emergencySection.id);
      await attach(invoice.id, plan, inpatientSection.id);

      const owed = COVERED_SHARE * 2;
      expect(await payFromPatient(invoice.id, owed + 0.01)).toBeForbidden();
      expect(await payFromPatient(invoice.id, owed)).toHaveSucceeded();
    });
  });
});
