import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { addLabRequestToInvoice } from '@tamanu/database/models/LabRequest/hooks';
import { afterCreateHook as imagingAfterCreateHook } from '@tamanu/database/models/ImagingRequest/hooks';
import {
  ENCOUNTER_TYPES,
  INVOICEABLE_IMAGING_REQUEST_STATUSES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_STATUSES,
  PATIENT_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

import { createTestContext } from '../utilities';

// Where an auto-added item lands. The section is written when the item is created and never
// again, so a charge records the part of the stay it was made in even after the encounter moves.
describe('Invoice item sections', () => {
  let ctx;
  let models;
  let user;
  let patient;
  let product;
  let emergencySection;
  let inpatientSection;

  const createInvoiceForEncounter = async (encounterOverrides = {}) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      ...encounterOverrides,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${Date.now()}-${Math.random()}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
    });
    return { encounter, invoice };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    product = await models.InvoiceProduct.create(fake(models.InvoiceProduct, { insurable: false }));
    [emergencySection, inpatientSection] = await Promise.all(
      [PATIENT_STATUSES.EMERGENCY, PATIENT_STATUSES.INPATIENT].map(code =>
        models.ReferenceData.create(
          fake(models.ReferenceData, { type: REFERENCE_TYPES.INVOICE_SECTION, code }),
        ),
      ),
    );
  });

  beforeEach(async () => {
    await models.InvoiceItem.truncate({ cascade: true });
    await models.Invoice.truncate({ cascade: true });
  });

  afterAll(() => ctx.close());

  describe('automatically added items', () => {
    it('resolves the section from the encounter category', async () => {
      const { encounter } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      expect(await models.Invoice.resolveInvoiceSectionId(encounter.encounterType)).toBe(
        emergencySection.id,
      );
    });

    it('resolves to nothing for an encounter type that is never sectioned', async () => {
      expect(await models.Invoice.resolveInvoiceSectionId(ENCOUNTER_TYPES.VACCINATION)).toBe(null);
    });

    it('resolves to nothing for a section that has been hidden', async () => {
      // Hiding a reference data row is how a deployment turns a section off, as the admin Manage
      // tab treats non-current rows as not configured.
      await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.INVOICE_SECTION,
          code: PATIENT_STATUSES.OUTPATIENT,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );

      expect(await models.Invoice.resolveInvoiceSectionId(ENCOUNTER_TYPES.CLINIC)).toBe(null);
    });

    it('resolves to nothing where the deployment has not configured that section', async () => {
      expect(await models.Invoice.resolveInvoiceSectionId(ENCOUNTER_TYPES.CLINIC)).toBe(null);
    });

    it('lands an auto-added item in the section for the encounter it is added against', async () => {
      const { encounter, invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      // The source record only has to be a persisted model instance; the encounter itself serves.
      await models.Invoice.addItemToInvoice(encounter, encounter.id, product, user.id);

      const [item] = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(item.invoiceSectionId).toBe(emergencySection.id);
    });

    it('keeps an auto-added item in its section when the encounter later changes category', async () => {
      const { encounter, invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });
      await models.Invoice.addItemToInvoice(encounter, encounter.id, product, user.id);

      // The patient is admitted, and the same source record is re-added — a procedure being
      // edited, say. The charge was still made in Emergency.
      await encounter.update({ encounterType: ENCOUNTER_TYPES.ADMISSION });
      await models.Invoice.addItemToInvoice(encounter, encounter.id, product, user.id);

      const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(items).toHaveLength(1);
      expect(items[0].invoiceSectionId).toBe(emergencySection.id);
      // Inpatient is configured, so there was somewhere for it to move to and it did not.
      expect(items[0].invoiceSectionId).not.toBe(inpatientSection.id);
    });

    it('sections every item of a lab request from one resolution', async () => {
      // The lab hook resolves the section once for the request and passes it to each item, so this
      // covers that the hoisted value reaches them all and names the right encounter.
      const { encounter, invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      const category = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.LAB_TEST_CATEGORY }),
      );
      const testTypes = await Promise.all(
        [0, 1].map(() =>
          models.LabTestType.create(fake(models.LabTestType, { labTestCategoryId: category.id })),
        ),
      );
      for (const testType of testTypes) {
        await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, {
            category: INVOICE_ITEMS_CATEGORIES.LAB_TEST_TYPE,
            sourceRecordId: testType.id,
            insurable: false,
          }),
        );
      }

      const labRequest = await models.LabRequest.create(
        fake(models.LabRequest, {
          encounterId: encounter.id,
          requestedById: user.id,
          labTestCategoryId: category.id,
        }),
      );
      for (const testType of testTypes) {
        await models.LabTest.create(
          fake(models.LabTest, { labRequestId: labRequest.id, labTestTypeId: testType.id }),
        );
      }

      await addLabRequestToInvoice(labRequest);

      const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(items).toHaveLength(2);
      for (const item of items) {
        expect(item.invoiceSectionId).toBe(emergencySection.id);
      }
    });

    it("sections an imaging request's items from one resolution", async () => {
      // The imaging hook resolves against a different source model and its own product lookup, so
      // the lab test does not cover it.
      const { encounter, invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      const imagingType = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.IMAGING_TYPE }),
      );
      await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.IMAGING_TYPE,
          sourceRecordId: imagingType.id,
          insurable: false,
        }),
      );

      const imagingRequest = await models.ImagingRequest.create(
        fake(models.ImagingRequest, {
          encounterId: encounter.id,
          requestedById: user.id,
          imagingType: imagingType.code,
          // Pinned, because only some statuses are invoiceable and fake picks one at random.
          status: INVOICEABLE_IMAGING_REQUEST_STATUSES[0],
        }),
      );
      await imagingAfterCreateHook(imagingRequest);

      const items = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.invoiceSectionId).toBe(emergencySection.id);
      }
    });

    it('leaves an auto-added item unsectioned on an encounter type that is never sectioned', async () => {
      const { encounter, invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.VACCINATION,
      });

      await models.Invoice.addItemToInvoice(encounter, encounter.id, product, user.id);

      const [item] = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(item.invoiceSectionId).toBe(null);
    });
  });
});
