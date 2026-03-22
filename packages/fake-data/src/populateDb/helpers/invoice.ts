import { times } from 'lodash';

import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateInvoiceParams extends CommonParams {
  encounterId: string;
  userId: string;
  referenceDataId: string;
  productId: string;
  itemCount?: number;
}
export const createInvoice = async ({
  models,
  limit,
  encounterId,
  userId,
  referenceDataId,
  productId,
  itemCount = chance.integer({ min: 1, max: 50 }),
}: CreateInvoiceParams): Promise<void> => {
  const {
    Invoice,
    InvoiceDiscount,
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

  await Promise.all(
    times(itemCount, () =>
      limit(async () => {
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
      }),
    ),
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
