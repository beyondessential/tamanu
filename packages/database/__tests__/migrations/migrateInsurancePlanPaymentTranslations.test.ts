import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { closeDatabase, createTestDatabase } from '../utilities';
import { down, up } from '../../src/migrations/1793235590140-migrateInsurancePlanPaymentTranslations';

describe('migrateInsurancePlanPaymentTranslations migration', () => {
  let models;
  let sequelize;

  beforeAll(async () => {
    ({ models, sequelize } = await createTestDatabase());
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await models.TranslatedString.destroy({ where: {}, force: true });
  });

  const runUp = () => up(sequelize.getQueryInterface());
  const runDown = () => down(sequelize.getQueryInterface());

  const addTranslation = (stringId: string, text: string, language = 'en') =>
    models.TranslatedString.create({ stringId, language, text });

  const textFor = async (stringId: string, language = 'en') =>
    (await models.TranslatedString.findOne({ where: { stringId, language } }))?.text;

  it('carries a renamed string across to its new id', async () => {
    await addTranslation('adminSidebar.insurerPayments', 'Paiements des assureurs', 'fr');

    await runUp();

    expect(await textFor('adminSidebar.insurancePlanPayments', 'fr')).toEqual(
      'Paiements des assureurs',
    );
  });

  it('carries every status under the renamed enum prefix', async () => {
    await addTranslation('invoice.property.insurerPaymentStatus.paid', 'Settled');
    await addTranslation('invoice.property.insurerPaymentStatus.rejected', 'Declined');

    await runUp();

    expect(await textFor('invoice.property.insurancePlanPaymentStatus.paid')).toEqual('Settled');
    expect(await textFor('invoice.property.insurancePlanPaymentStatus.rejected')).toEqual(
      'Declined',
    );
  });

  it('carries each language separately', async () => {
    await addTranslation('invoice.modal.payment.insurerPayments', 'Insurer payments', 'en');
    await addTranslation('invoice.modal.payment.insurerPayments', 'Paiements', 'fr');

    await runUp();

    expect(await textFor('invoice.modal.payment.insurancePlanPayments', 'en')).toEqual(
      'Insurer payments',
    );
    expect(await textFor('invoice.modal.payment.insurancePlanPayments', 'fr')).toEqual('Paiements');
  });

  it('leaves a translation already written against the new id alone', async () => {
    await addTranslation('adminSidebar.insurerPayments', 'Old wording');
    await addTranslation('adminSidebar.insurancePlanPayments', 'Already translated');

    await runUp();

    expect(await textFor('adminSidebar.insurancePlanPayments')).toEqual('Already translated');
  });

  it('leaves unrelated translations alone, and runs clean with nothing to carry', async () => {
    await addTranslation('invoice.property.patientPaymentStatus.paid', 'Paid');

    await runUp();

    expect(await textFor('invoice.property.patientPaymentStatus.paid')).toEqual('Paid');
    expect(await models.TranslatedString.count()).toEqual(1);
  });

  it('removes the new ids again on the way down', async () => {
    await addTranslation('invoice.property.insurerPaymentStatus.paid', 'Settled');
    await runUp();

    await runDown();

    expect(await textFor('invoice.property.insurancePlanPaymentStatus.paid')).toBeUndefined();
    // the originals are untouched, so the strings are not lost
    expect(await textFor('invoice.property.insurerPaymentStatus.paid')).toEqual('Settled');
  });
});
