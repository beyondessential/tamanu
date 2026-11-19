import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  ENCOUNTER_TYPES,
  INVOICE_STATUSES,
  PATIENT_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

import { settingsCache } from '@tamanu/settings';

import { createTestContext } from '../utilities';

// The section an invoice carries over HTTP: what the endpoint returns, and what the update route
// accepts when an item names one. Where an auto-added item lands is covered in
// InvoiceItemSections.test.js, alongside the model that decides it.
describe('Invoice encounter type sections', () => {
  let ctx;
  let models;
  let app;
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

  const createItem = (invoiceId, overrides = {}) =>
    models.InvoiceItem.create(
      fake(models.InvoiceItem, {
        invoiceId,
        productId: product.id,
        quantity: 1,
        orderedByUserId: user.id,
        ...overrides,
      }),
    );

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
    app = await ctx.baseApp.asUser(user);
  });

  beforeEach(async () => {
    await models.InvoiceItem.truncate({ cascade: true });
    await models.Invoice.truncate({ cascade: true });
  });

  afterAll(() => ctx.close());

  describe('PUT /api/invoices/:id', () => {
    it('records the section a new item is added against', async () => {
      const { invoice } = await createInvoiceForEncounter();

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: crypto.randomUUID(),
            orderDate: '2026-03-02',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
            invoiceSectionId: emergencySection.id,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      const [saved] = await models.InvoiceItem.findAll({ where: { invoiceId: invoice.id } });
      expect(saved.invoiceSectionId).toBe(emergencySection.id);
    });

    it('keeps an existing item in its section when a different one is sent', async () => {
      const { invoice } = await createInvoiceForEncounter();
      const item = await createItem(invoice.id, {
        id: crypto.randomUUID(),
        orderDate: '2026-03-02',
        invoiceSectionId: emergencySection.id,
      });

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: item.id,
            orderDate: '2026-03-06',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
            invoiceSectionId: inpatientSection.id,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      await item.reload();
      expect(item.invoiceSectionId).toBe(emergencySection.id);
      // The date edit itself still lands; it just cannot carry the item to another section.
      expect(item.orderDate).toBe('2026-03-06');
    });

    it("sections a new item by the encounter's category when none is sent", async () => {
      // The invoice shows no headers until the encounter has moved, so the form has no section to
      // name. The item still belongs to the category it was charged in.
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });
      const newItemId = crypto.randomUUID();

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: newItemId,
            orderDate: '2026-03-02',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      const created = await models.InvoiceItem.findByPk(newItemId);
      expect(created.invoiceSectionId).toBe(emergencySection.id);
    });

    it("refuses an item id that belongs to another invoice", async () => {
      // The upsert writes by id, so accepting a foreign id would move that invoice's line onto
      // this one and overwrite the section it was charged in.
      const { invoice: otherInvoice } = await createInvoiceForEncounter();
      const otherItem = await createItem(otherInvoice.id, {
        id: crypto.randomUUID(),
        orderDate: '2026-03-02',
        invoiceSectionId: emergencySection.id,
      });
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.ADMISSION,
      });

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: otherItem.id,
            orderDate: '2026-03-06',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
          },
        ],
      });

      expect(result).toHaveRequestError();
      await otherItem.reload();
      expect(otherItem.invoiceId).toBe(otherInvoice.id);
      expect(otherItem.invoiceSectionId).toBe(emergencySection.id);
    });

    it('rejects an empty section id rather than writing it to the foreign key', async () => {
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: crypto.randomUUID(),
            orderDate: '2026-03-02',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
            invoiceSectionId: '',
          },
        ],
      });

      expect(result).toHaveRequestError();
    });

    it('accepts a provisioned section id, which is a code and not a uuid', async () => {
      const coded = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          id: 'invoiceSection-test-outpatient',
          type: REFERENCE_TYPES.INVOICE_SECTION,
          code: PATIENT_STATUSES.OUTPATIENT,
        }),
      );
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });
      const newItemId = crypto.randomUUID();

      try {
        const result = await app.put(`/api/invoices/${invoice.id}`).send({
          items: [
            {
              id: newItemId,
              orderDate: '2026-03-02',
              orderedByUserId: user.id,
              productId: product.id,
              quantity: 1,
              invoiceSectionId: coded.id,
            },
          ],
        });

        expect(result).toHaveSucceeded();
        const created = await models.InvoiceItem.findByPk(newItemId);
        expect(created.invoiceSectionId).toBe(coded.id);
      } finally {
        // The item goes first: it references the row, so a hard delete the other way round would
        // violate the foreign key.
        await models.InvoiceItem.destroy({ where: { id: newItemId }, force: true });
        await coded.destroy({ force: true });
      }
    });

    it('rejects a section that has been hidden', async () => {
      // Hiding the reference data row is how a deployment turns a section off, so it is no longer
      // somewhere a new item can be charged.
      const hidden = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.INVOICE_SECTION,
          code: PATIENT_STATUSES.OUTPATIENT,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });

      try {
        const result = await app.put(`/api/invoices/${invoice.id}`).send({
          items: [
            {
              id: crypto.randomUUID(),
              orderDate: '2026-03-02',
              orderedByUserId: user.id,
              productId: product.id,
              quantity: 1,
              invoiceSectionId: hidden.id,
            },
          ],
        });

        expect(result).toHaveRequestError();
      } finally {
        await hidden.destroy({ force: true });
      }
    });

    it('rejects a section id that is not an invoice section', async () => {
      const { invoice } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.TRIAGE,
      });
      const notASection = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );

      try {
        const result = await app.put(`/api/invoices/${invoice.id}`).send({
          items: [
            {
              id: crypto.randomUUID(),
              orderDate: '2026-03-02',
              orderedByUserId: user.id,
              productId: product.id,
              quantity: 1,
              invoiceSectionId: notASection.id,
            },
          ],
        });

        expect(result).toHaveRequestError();
      } finally {
        // Released like the rest: nothing references it, so this row simply leaked before.
        await notASection.destroy({ force: true });
      }
    });
  });

  describe('GET /api/encounter/:id/invoice', () => {
    describe('with the setting on', () => {
      beforeEach(async () => {
        await models.Setting.set('features.invoicing.splitByEncounterType', true);
        settingsCache.reset();
      });

      afterEach(async () => {
        await models.Setting.set('features.invoicing.splitByEncounterType', false);
        settingsCache.reset();
      });

      it("returns the section for the encounter's current category", async () => {
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        expect(result.body.sections).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ invoiceSectionId: inpatientSection.id, code: 'inpatient' }),
          ]),
        );
      });

      it('splits into two sections once the encounter has moved category', async () => {
        // The move is read from the changelog the trigger writes, which is the only record of when
        // the encounter changed category. Without it this would collapse to a single section.
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.TRIAGE,
          startDate: '2026-03-01 09:00:00',
        });
        await encounter.update({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: '2026-03-04 14:30:00',
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        expect(result.body.sections.map(section => section.invoiceSectionId)).toEqual([
          emergencySection.id,
          inpatientSection.id,
        ]);
        // The move day closes the first period and opens the second, because an item carries a
        // date and not a time.
        expect(result.body.sections[0]).toMatchObject({
          startDate: '2026-03-01',
          endDate: '2026-03-04',
        });
        expect(result.body.sections[1]).toMatchObject({ startDate: '2026-03-04' });
      });

      it("sends the encounter's own period alongside the sections", async () => {
        // The form bounds a row carrying no section from this, rather than deriving it again from
        // the raw dates, so the two cannot disagree on a facility in another timezone.
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: '2026-03-04 14:30:00',
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        expect(result.body.encounterPeriod).toMatchObject({ startDate: '2026-03-04' });
      });

      it('returns no sections where the deployment has configured none', async () => {
        // A deployment provisioned before this feature has no invoice section rows at all, and
        // hits this on every invoice load while the setting is on.
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
        });
        const configuredIds = [emergencySection.id, inpatientSection.id];
        await models.ReferenceData.destroy({ where: { id: configuredIds } });

        try {
          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

          expect(result).toHaveSucceeded();
          expect(result.body.sections).toBe(null);
        } finally {
          // Restored even if an assertion above fails, since every later case in this file needs
          // these rows and would otherwise fail for reasons of its own.
          await models.ReferenceData.restore({ where: { id: configuredIds } });
        }
      });

      it('returns an empty section list for an encounter type that is never sectioned', async () => {
        // Distinct from the setting being off, which sends null: here splitting is on and the
        // encounter simply has no category to sit in.
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.VACCINATION,
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        expect(result.body.sections).toEqual([]);
        expect(result.body.encounterPeriod).not.toBe(null);
      });

      it('keeps an item whose section is no longer configured, listing it unlabelled', async () => {
        // Hiding a section is how a deployment turns it off, but items already charged there keep
        // the section they were charged in; the invoice simply has nowhere to head them.
        const { encounter, invoice } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
        });
        const item = await createItem(invoice.id, {
          id: crypto.randomUUID(),
          orderDate: '2026-03-02',
          invoiceSectionId: emergencySection.id,
        });
        await models.ReferenceData.destroy({ where: { id: emergencySection.id } });

        try {
          const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

          expect(result).toHaveSucceeded();
          // The hidden section is not offered as a heading...
          expect(
            result.body.sections.map(section => section.invoiceSectionId),
          ).not.toContain(emergencySection.id);
          // ...but the item still carries where it was charged.
          const returned = result.body.items.find(each => each.id === item.id);
          expect(returned.invoiceSectionId).toBe(emergencySection.id);
        } finally {
          await models.ReferenceData.restore({ where: { id: emergencySection.id } });
        }
      });

      it('carries a section its items name even when that period is unknown', async () => {
        // The facility holds no changelog for the move, so Emergency has no period of its own. It
        // is still listed, because an item records that it was charged there.
        const { encounter, invoice } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
        });
        await createItem(invoice.id, {
          id: crypto.randomUUID(),
          orderDate: '2026-03-02',
          invoiceSectionId: emergencySection.id,
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        const emergency = result.body.sections.find(
          section => section.invoiceSectionId === emergencySection.id,
        );
        expect(emergency).toMatchObject({ startDate: null, endDate: null });
        // and the item's own section id survives the round trip to the client
        expect(result.body.items[0].invoiceSectionId).toBe(emergencySection.id);
      });
    });

    it("sends the encounter's period even while the setting is off", async () => {
      // Every item's date is bounded by the encounter, which is a general invoicing rule and not
      // part of splitting. Gating this behind the display setting left a default deployment with
      // no date validation at all.
      const { encounter } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: '2026-03-04 14:30:00',
      });

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

      expect(result).toHaveSucceeded();
      expect(result.body.sections).toBe(null);
      expect(result.body.encounterPeriod).toMatchObject({ startDate: '2026-03-04' });
    });

    describe('in a facility timezone behind the primary one', () => {
      beforeEach(async () => {
        await models.Setting.set('facilityTimeZone', 'Pacific/Honolulu');
        settingsCache.reset();
      });

      afterEach(async () => {
        await models.Setting.set('facilityTimeZone', null);
        settingsCache.reset();
      });

      it("resolves the encounter's period on the facility's own calendar date", async () => {
        // Tests run with Pacific/Auckland as the primary timezone, where this is just after
        // midnight. In Honolulu it is still the previous day, and the invoice is read there.
        const { encounter } = await createInvoiceForEncounter({
          encounterType: ENCOUNTER_TYPES.ADMISSION,
          startDate: '2026-03-01 00:30:00',
        });

        const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

        expect(result).toHaveSucceeded();
        expect(result.body.encounterPeriod.startDate).toBe('2026-02-28');
      });
    });

    it('returns no sections while the setting is off', async () => {
      const { encounter } = await createInvoiceForEncounter({
        encounterType: ENCOUNTER_TYPES.ADMISSION,
      });

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);

      expect(result).toHaveSucceeded();
      expect(result.body.sections).toBe(null);
    });
  });

  describe('permissions', () => {
    it('forbids reading an invoice without permission', async () => {
      const { encounter } = await createInvoiceForEncounter();
      const baseApp = await ctx.baseApp.asRole('base');

      const result = await baseApp.get(`/api/encounter/${encounter.id}/invoice`);

      expect(result).toBeForbidden();
    });

    it('forbids writing an item, and so its section, without permission', async () => {
      const { invoice } = await createInvoiceForEncounter();
      const baseApp = await ctx.baseApp.asRole('base');

      const result = await baseApp.put(`/api/invoices/${invoice.id}/`).send({
        items: [
          {
            id: crypto.randomUUID(),
            orderDate: '2026-03-02',
            orderedByUserId: user.id,
            productId: product.id,
            quantity: 1,
          },
        ],
      });

      expect(result).toBeForbidden();
    });
  });
});
