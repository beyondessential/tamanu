import * as xlsx from 'xlsx';
import { chain, round } from 'lodash';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { getInvoiceInsurerPaymentStatus, getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { INVOICE_INSURER_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
import { ValidationError } from '../errors';

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
    date: z.string().date(),
    amount: z.coerce
      .number()
      .positive()
      .transform(amount => round(amount, 2)),
    invoiceId: z.string(),
    insurerId: z.string(),
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
  if (!sheet) {
    throw new Error('No sheet found in workbook');
  }

  for (let index = 0; index <= sheet.length; index++) {
    const row = sheet[index];
    const { data, error } = await insurerPaymentImportSchema.safeParseAsync(row);

    if (error) {
      errors.push(new ValidationError('', index + 1, error));
      continue;
    }

    const invoice = await models.Invoice.findByPk(data.invoiceId, {
      include: models.Invoice.getFullReferenceAssociations(models),
    }).then(invoice => invoice.addVirtualFields());

    if (!invoice) {
      errors.push(new ValidationError('', index + 1, 'Invoice not found'));
      continue;
    }

    if (invoice.status !== INVOICE_STATUSES.FINALISED) {
      errors.push(new ValidationError('', index + 1, 'Invoice is not finalised'));
      continue;
    }
    if (!invoice.insurers.map(insurer => insurer.insurerId).includes(data.insurerId)) {
      errors.push(new ValidationError('', index + 1, 'Insurer not found for this invoice'));
      continue;
    }

    const { insurerDiscountTotal, insurerPaymentsTotal } = getInvoiceSummary(invoice);

    //* Block payment if the amount is greater than the amount owing
    if (
      chain(data.amount)
        .add(insurerPaymentsTotal)
        .round(2)
        .gt(insurerDiscountTotal)
        .value()
    ) {
      //TODO: push error to errors array
      errors.push(new ValidationError('', index + 1, 'Amount is greater than the amount owing'));
      continue;
    }

    // Skip database actions if there are errors
    if (errors.length) continue;

    const payment = await models.InvoicePayment.create(
      {
        invoiceId: data.invoiceId,
        date: data.date,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
      },
      { returning: true, transaction },
    );
    await models.InvoiceInsurerPayment.create({
      invoicePaymentId: payment.id,
      insurerId: data.insurerId,
      status:
        data.amount === 0
          ? INVOICE_INSURER_PAYMENT_STATUSES.REJECTED
          : data.amount === insurerDiscountTotal
          ? INVOICE_INSURER_PAYMENT_STATUSES.PAID
          : INVOICE_INSURER_PAYMENT_STATUSES.PARTIAL,
    });

    //Update the overall insurer payment status to invoice
    await models.Invoice.update(
      {
        insurerPaymentStatus: getInvoiceInsurerPaymentStatus(
          chain(data.amount)
            .add(insurerPaymentsTotal)
            .round(2)
            .value(),
          chain(insurerDiscountTotal)
            .round(2)
            .value(),
        ),
      },
      { where: { id: data.invoiceId } },
    );
  }

  stats.error = errors.length;
  stats.ok = sheet.length - errors.length;
  stats.imported = stats.ok === sheet.length ? stats.ok : 0;
}
