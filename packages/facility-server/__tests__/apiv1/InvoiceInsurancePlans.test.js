import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
  INVOICE_STATUSES,
  PATIENT_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

describe('Invoice Insurance Plans API', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let user = null;
  let patient = null;
  let encounter = null;
  let emergencySection = null;
  let inpatientSection = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    [emergencySection, inpatientSection] = await Promise.all(
      [PATIENT_STATUSES.EMERGENCY, PATIENT_STATUSES.INPATIENT].map(code =>
        models.ReferenceData.create(
          fake(models.ReferenceData, { type: REFERENCE_TYPES.INVOICE_SECTION, code }),
        ),
      ),
    );
  });

  beforeEach(async () => {
    await models.Invoice.truncate();
    await models.InvoiceInsurancePlan.truncate();
    await models.InvoicesInvoiceInsurancePlan.truncate();
  });

  afterAll(() => ctx.close());

  describe('PUT /:id/insurancePlans', () => {
    it('should add insurance plans to an invoice', async () => {
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-001',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      const plan1 = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          name: 'Plan 1',
          code: 'PLAN-1',
        }),
      );

      const plan2 = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          name: 'Plan 2',
          code: 'PLAN-2',
        }),
      );

      const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
        invoiceInsurancePlanIds: [plan1.id, plan2.id],
      });

      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(2);
      expect(result.body.data).toHaveLength(2);
      expect(result.body.data.map(d => d.invoiceInsurancePlanId)).toEqual(
        expect.arrayContaining([plan1.id, plan2.id]),
      );
    });

    it('should remove insurance plans from an invoice', async () => {
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-002',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      const plan1 = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          name: 'Plan 3',
          code: 'PLAN-3',
        }),
      );

      const plan2 = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          name: 'Plan 4',
          code: 'PLAN-4',
        }),
      );

      // Add both plans
      await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
        invoiceInsurancePlanIds: [plan1.id, plan2.id],
      });

      // Remove one plan
      const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
        invoiceInsurancePlanIds: [plan1.id],
      });

      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(1);
      expect(result.body.data).toHaveLength(1);
      expect(result.body.data[0].invoiceInsurancePlanId).toBe(plan1.id);
    });

    it('should return error when invoice is not IN_PROGRESS', async () => {
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-006',
        date: new Date(),
        status: INVOICE_STATUSES.FINALISED,
      });

      const plan1 = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          name: 'Plan 5',
          code: 'PLAN-5',
        }),
      );

      const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
        invoiceInsurancePlanIds: [plan1.id],
      });

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Only in progress invoices can be updated');
    });

    describe('attaching to a section', () => {
      const createInvoice = () =>
        models.Invoice.create({
          encounterId: encounter.id,
          displayId: `INV-${crypto.randomUUID().slice(0, 8)}`,
          date: new Date(),
          status: INVOICE_STATUSES.IN_PROGRESS,
        });

      const createPlan = () =>
        models.InvoiceInsurancePlan.create(fake(models.InvoiceInsurancePlan));

      const attachmentsFor = invoiceId =>
        models.InvoicesInvoiceInsurancePlan.findAll({
          where: { invoiceId },
          attributes: ['invoiceInsurancePlanId', 'invoiceSectionId'],
          raw: true,
        });

      it('writes the attachment against the named section', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toHaveSucceeded();
        expect(await attachmentsFor(invoice.id)).toEqual([
          { invoiceInsurancePlanId: plan.id, invoiceSectionId: emergencySection.id },
        ]);
      });

      it('leaves the other sections alone when one section is reconciled', async () => {
        const invoice = await createInvoice();
        const [emergencyPlan, inpatientPlan] = await Promise.all([createPlan(), createPlan()]);

        for (const [plan, section] of [
          [emergencyPlan, emergencySection],
          [inpatientPlan, inpatientSection],
        ]) {
          const added = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
            invoiceInsurancePlanIds: [plan.id],
            invoiceSectionId: section.id,
          });
          expect(added).toHaveSucceeded();
        }

        // Emptying Emergency's plans must not reach the plan attached to Inpatient.
        const cleared = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [],
          invoiceSectionId: emergencySection.id,
        });

        expect(cleared).toHaveSucceeded();
        expect(await attachmentsFor(invoice.id)).toEqual([
          { invoiceInsurancePlanId: inpatientPlan.id, invoiceSectionId: inpatientSection.id },
        ]);
      });

      it('carries the same plan on two sections as two attachments', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        for (const section of [emergencySection, inpatientSection]) {
          const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
            invoiceInsurancePlanIds: [plan.id],
            invoiceSectionId: section.id,
          });
          expect(result).toHaveSucceeded();
        }

        const attachments = await attachmentsFor(invoice.id);
        expect(attachments).toHaveLength(2);
        expect(attachments.map(a => a.invoiceSectionId).sort()).toEqual(
          [emergencySection.id, inpatientSection.id].sort(),
        );
      });

      it('does not duplicate a plan already attached to that section', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
            invoiceInsurancePlanIds: [plan.id],
            invoiceSectionId: emergencySection.id,
          });
          expect(result).toHaveSucceeded();
        }

        expect(await attachmentsFor(invoice.id)).toHaveLength(1);
      });

      it('refuses a section that is not a current invoice section', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();
        const retiredSection = await models.ReferenceData.create(
          fake(models.ReferenceData, {
            type: REFERENCE_TYPES.INVOICE_SECTION,
            visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          }),
        );

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: retiredSection.id,
        });

        expect(result).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      it('refuses a plan that already covers the whole invoice', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const invoiceWide = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
        });
        expect(invoiceWide).toHaveSucceeded();

        const sectioned = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(sectioned).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toEqual([
          { invoiceInsurancePlanId: plan.id, invoiceSectionId: null },
        ]);
      });

      // The invoice-level action stays on a split invoice still holding a whole-invoice plan, so
      // this is the path behind it.
      it('attaches a plan to the whole of an invoice whose items are split', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();
        for (const section of [emergencySection, inpatientSection]) {
          await models.InvoiceItem.create(
            fake(models.InvoiceItem, {
              id: crypto.randomUUID(),
              invoiceId: invoice.id,
              orderedByUserId: user.id,
              quantity: 1,
              invoiceSectionId: section.id,
            }),
          );
        }

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
        });

        expect(result).toHaveSucceeded();
        expect(await attachmentsFor(invoice.id)).toEqual([
          { invoiceInsurancePlanId: plan.id, invoiceSectionId: null },
        ]);
      });

      it('refuses a plan id naming no insurance plan', async () => {
        const invoice = await createInvoice();

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [crypto.randomUUID()],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toHaveRequestError();
        expect(result.body.error.message).toContain('does not exist');
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      it('refuses the same plan named twice in one request', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id, plan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      it('refuses an empty section id rather than writing it to the foreign key', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: '',
        });

        expect(result).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      it("returns every attachment on the invoice, not only the named section's", async () => {
        const invoice = await createInvoice();
        const [emergencyPlan, inpatientPlan] = await Promise.all([createPlan(), createPlan()]);

        await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [inpatientPlan.id],
          invoiceSectionId: inpatientSection.id,
        });
        const result = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [emergencyPlan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toHaveSucceeded();
        expect(result.body.count).toBe(2);
        expect(result.body.data.map(row => row.invoiceInsurancePlanId).sort()).toEqual(
          [emergencyPlan.id, inpatientPlan.id].sort(),
        );
      });

      it('refuses a request carrying no session', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const result = await baseApp.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      // The route's own check is one of two that stop this, so the case pins the contract
      // rather than the line enforcing it.
      it('refuses a user without write access to invoices', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();
        const readOnlyApp = await baseApp.asRole('base');

        const result = await readOnlyApp.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: emergencySection.id,
        });

        expect(result).toBeForbidden();
        expect(await attachmentsFor(invoice.id)).toHaveLength(0);
      });

      it('refuses covering the whole invoice with a plan already on a section', async () => {
        const invoice = await createInvoice();
        const plan = await createPlan();

        const sectioned = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
          invoiceSectionId: emergencySection.id,
        });
        expect(sectioned).toHaveSucceeded();

        const invoiceWide = await app.put(`/api/invoices/${invoice.id}/insurancePlans`).send({
          invoiceInsurancePlanIds: [plan.id],
        });

        expect(invoiceWide).toHaveRequestError();
        expect(await attachmentsFor(invoice.id)).toEqual([
          { invoiceInsurancePlanId: plan.id, invoiceSectionId: emergencySection.id },
        ]);
      });
    });
  });
});
