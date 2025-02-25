import type { Models } from '@tamanu/database';
import { times } from 'lodash';
const { fake, chance } = require('@tamanu/shared/test-helpers/fake');

interface CreateInvoiceParams {
  models: Models;
  encounterId: string;
  userId: string;
  referenceDataId: string;
  productId: string;
  itemCount?: number;
}
export const createInvoice = async ({
  models: {
    Invoice,
    InvoiceDiscount,
    InvoiceInsurer,
    InvoicePayment,
    InvoiceInsurerPayment,
    InvoicePatientPayment,
    InvoiceItemDiscount,
    InvoiceItem,
  },
  encounterId,
  userId,
  referenceDataId,
  productId,
  itemCount = chance.integer({ min: 1, max: 50 }),
}: CreateInvoiceParams): Promise<void> => {
  const invoice = await Invoice.create(
    fake(Invoice, {
      encounterId,
    }),
  );

  await InvoiceDiscount.create(
    fake(InvoiceDiscount, {
      invoiceId: invoice.id,
      appliedByUserId: userId,
    }),
  );

  times(itemCount, async () => {
    const invoiceItem = await InvoiceItem.create(
      fake(InvoiceItem, {
        invoiceId: invoice.id,
        productId,
        orderedByUserId: userId,
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
      insurerId: referenceDataId,
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
      insurerId: referenceDataId,
    }),
  );
  await InvoicePatientPayment.create(
    fake(InvoicePatientPayment, {
      invoicePaymentId: invoicePayment.id,
      methodId: referenceDataId,
    }),
  );
};
