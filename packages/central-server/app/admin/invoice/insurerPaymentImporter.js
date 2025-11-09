import * as xlsx from 'xlsx';
import { chain } from 'lodash';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import {
  getInvoiceInsurerPaymentStatus,
  getInvoiceSummary,
  round,
  getSpecificInsurerPaymentRemainingBalance,
} from '@tamanu/shared/utils/invoice';
import { INVOICE_INSURER_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
import { ValidationError } from '../errors';
import Decimal from 'decimal.js';
import { statkey, updateStat } from '../stats';

/**
 * Parse an excel file into a object with keys as sheet names and values as arrays of objects
 * @param {File} file
 */
export const parseExcel = filePath => {
  const workbook = xlsx.readFile(filePath);

  return chain(workbook.Sheets)
    .mapValues(sheet => xlsx.utils.sheet_to_json(sheet))
    .value();
};

//* The random generator should use a format of 8 alphanumeric characters but not include 0, O or I - please check this is sufficient to guarantee uniqueness with 100 entries/day. Letters should be capitalised.
const receiptNumberGenerator = customAlphabet('123456789ABCDEFGHJKLMNPQRSTWUVXYZ', 8);

const insurerPaymentImportSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string().date(),
    amount: z.coerce
      .number()
      .min(0)
      .transform(amount => round(amount, 2)),
    invoiceNumber: z.string(),
    insurerId: z.string(),
    reason: z.string().optional(),
  })
  .strip()
  .transform(data => ({
    ...data,
    receiptNumber: receiptNumberGenerator(),
  }));

export async function insurerPaymentImporter({ errors, models, stats, file, checkPermission }) {
  checkPermission('create', 'InvoicePayment');
  const workbook = parseExcel(file);

  const sheet = Object.values(workbook).at(0);
  const sheetName = Object.keys(workbook).at(0);
  const subStat = {};
  if (!sheet) {
    throw new Error('No sheet found in workbook');
  }

  let index = 0;
  for await (const row of sheet) {
    const { data, error } = await insurerPaymentImportSchema.safeParseAsync(row);

    if (error) {
      errors.push(new ValidationError(sheetName, index, error));
      continue;
    }

    const countInvoices = await models.Invoice.count({ where: { displayId: data.invoiceNumber } });
    if (!countInvoices) {
      errors.push(new ValidationError(sheetName, index, 'Invoice not found'));
      continue;
    }

    if (countInvoices > 1) {
      errors.push(new ValidationError(sheetName, index, 'Multiple invoices found'));
      continue;
    }

    const invoice = await models.Invoice.findOne({
      where: { displayId: data.invoiceNumber },
      include: models.Invoice.getFullReferenceAssociations(),
    });

    if (!invoice) {
      errors.push(new ValidationError(sheetName, index, 'Invoice not found'));
      continue;
    }

    if (invoice.status !== INVOICE_STATUSES.FINALISED) {
      errors.push(new ValidationError(sheetName, index, 'Invoice is not finalised'));
      continue;
    }

    const {
      itemsSubtotal,
      insurerPaymentsTotal: allInsurerPaymentsTotal,
      insurerDiscountTotal: allInsurerDiscountTotal,
    } = getInvoiceSummary(invoice);
    const {
      insurerDiscountTotal,
      insurerPaymentRemainingBalance,
    } = getSpecificInsurerPaymentRemainingBalance(
      invoice?.insurers ?? [],
      invoice?.payments ?? [],
      data.insurerId,
      itemsSubtotal,
    );

    try {
      //check if the insurer payment already exists
      const insurerPayment = await models.InvoiceInsurerPayment.findByPk(data.id, {
        include: models.InvoiceInsurerPayment.getFullReferenceAssociations(),
      });
      if (insurerPayment) {
        checkPermission('write', 'InvoicePayment');
        //update the payment
        if (
          data.amount >
          round(
            new Decimal(insurerPaymentRemainingBalance)
              .add(insurerPayment.detail.amount)
              .toNumber(),
            2,
          )
        ) {
          errors.push(
            new ValidationError(sheetName, index, 'Amount is greater than the amount owing'),
          );
          continue;
        }
        await models.InvoicePayment.update(
          {
            invoiceId: invoice.id,
            date: data.date,
            amount: data.amount,
          },
          { where: { id: insurerPayment.invoicePaymentId } },
        );

        await models.InvoiceInsurerPayment.update(
          {
            insurerId: data.insurerId,
            reason: data.reason,
            status:
              data.amount === 0
                ? INVOICE_INSURER_PAYMENT_STATUSES.REJECTED
                : data.amount === round(insurerDiscountTotal, 2)
                ? INVOICE_INSURER_PAYMENT_STATUSES.PAID
                : INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL,
          },
          { where: { id: insurerPayment.id } },
        );
        //Update the overall insurer payment status to invoice
        await models.Invoice.update(
          {
            insurerPaymentStatus: getInvoiceInsurerPaymentStatus(
              new Decimal(allInsurerPaymentsTotal)
                .minus(insurerPayment.detail.amount)
                .add(data.amount)
                .toNumber(),
              allInsurerDiscountTotal,
            ),
          },
          { where: { id: invoice.id } },
        );

        updateStat(subStat, statkey('InvoiceInsurerPayment', sheetName), 'updated');
      } else {
        //create new payment
        //* Block payment if the amount is greater than the amount owing of this insurer
        if (data.amount > round(insurerPaymentRemainingBalance, 2)) {
          errors.push(
            new ValidationError(sheetName, index, 'Amount is greater than the amount owing'),
          );
          continue;
        }
        const payment = await models.InvoicePayment.create(
          {
            invoiceId: invoice.id,
            date: data.date,
            receiptNumber: data.receiptNumber,
            amount: data.amount,
          },
          { returning: true },
        );
        await models.InvoiceInsurerPayment.create({
          id: data.id,
          invoicePaymentId: payment.id,
          insurerId: data.insurerId,
          reason: data.reason,
          status:
            data.amount === 0
              ? INVOICE_INSURER_PAYMENT_STATUSES.REJECTED
              : data.amount === round(insurerDiscountTotal, 2)
              ? INVOICE_INSURER_PAYMENT_STATUSES.PAID
              : INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL,
        });
        //Update the overall insurer payment status to invoice
        await models.Invoice.update(
          {
            insurerPaymentStatus: getInvoiceInsurerPaymentStatus(
              new Decimal(allInsurerPaymentsTotal).add(data.amount).toNumber(),
              allInsurerDiscountTotal,
            ),
          },
          { where: { id: invoice.id } },
        );

        updateStat(subStat, statkey('InvoiceInsurerPayment', sheetName), 'created');
      }
    } catch (e) {
      errors.push(new ValidationError('', index, e));
    }

    index++;
  }

  stats.push(subStat);
}
