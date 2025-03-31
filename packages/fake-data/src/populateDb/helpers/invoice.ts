import { times } from 'lodash';

import type { Models } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake';

interface CreateInvoiceParams {
  models: Models;
  encounterId: string;
  userId: string;
  referenceDataId: string;
  productId: string;
  itemCount?: number;
}
export const createInvoice = async ({
  models,
  encounterId,
  userId,
  referenceDataId,
  productId,
  itemCount = chance.integer({ min: 1, max: 50 }),
}: CreateInvoiceParams): Promise<void> => {
  const {
    Invoice,
    InvoiceDiscount,
    InvoiceInsurer,
    InvoicePayment,
    InvoiceInsurerPayment,
    InvoicePatientPayment,
    InvoiceItemDiscount,
    InvoiceItem,
  } = models;

  const invoice = await Invoice.create(
    fake(Invoice, {
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
    }),
  );

  await InvoiceDiscount.create(
    fake(InvoiceDiscount, {
      invoiceId: invoice.id,
      appliedByUserId: userId || (await randomRecordId(models, 'User')),
    }),
  );

  times(itemCount, async () => {
    const invoiceItem = await InvoiceItem.create(
      fake(InvoiceItem, {
        invoiceId: invoice.id,
        productId: productId || (await randomRecordId(models, 'InvoiceProduct')),
        orderedByUserId: userId || (await randomRecordId(models, 'User')),
      }),
    );

    await InvoiceItemDiscount.create(
      fake(InvoiceItemDiscount, {
        invoiceItemId: invoiceItem.id,
      }),
    );
  });

  await InvoiceInsurer.create(
    fake(InvoiceInsurer, {
      invoiceId: invoice.id,
      insurerId: referenceDataId || (await randomRecordId(models, 'ReferenceData')),
    }),
  );

  const invoicePayment = await InvoicePayment.create(
    fake(InvoicePayment, {
      invoiceId: invoice.id,
    }),
  );
  await InvoiceInsurerPayment.create(
    fake(InvoiceInsurerPayment, {
      invoicePaymentId: invoicePayment.id,
      insurerId: referenceDataId || (await randomRecordId(models, 'ReferenceData')),
    }),
  );
  await InvoicePatientPayment.create(
    fake(InvoicePatientPayment, {
      invoicePaymentId: invoicePayment.id,
      methodId: referenceDataId || (await randomRecordId(models, 'ReferenceData')),
    }),
  );
};
