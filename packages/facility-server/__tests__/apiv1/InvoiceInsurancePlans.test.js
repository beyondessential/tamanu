import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { beforeEach, describe } from 'node:test';

describe('Invoice Insurance Plans API', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let user = null;
  let patient = null;
  let encounter = null;

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
  });
});
