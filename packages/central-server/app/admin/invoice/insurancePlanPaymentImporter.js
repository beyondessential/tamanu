import * as xlsx from 'xlsx';
// es-toolkit drops the `_.chain()` API by design, so this one site stays on lodash-es.
import { chain } from 'lodash-es';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import {
  getInsurancePlanItemsForInvoiceItem,
  getInsurancePlanPaymentBalance,
  getInvoiceInsurancePlanPaymentStatus,
  getInvoiceSummary,
  round,
} from '@tamanu/utils/invoice';
import { INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
import { toDateString } from '@tamanu/utils/dateTime';
import { ValidationError } from '../errors';
import Decimal from 'decimal.js';
import { statkey, updateStat } from '../stats';

/**
 * Parse an excel file into a object with keys as sheet names and values as arrays of objects
 * @param {File} file
 */
const parseExcel = filePath => {
  const workbook = xlsx.readFile(filePath, { cellDates: true });

  return chain(workbook.Sheets)
    .mapValues(sheet => xlsx.utils.sheet_to_json(sheet))
    .value();
};

//* The random generator should use a format of 8 alphanumeric characters but not include 0, O or I - please check this is sufficient to guarantee uniqueness with 100 entries/day. Letters should be capitalised.
const receiptNumberGenerator = customAlphabet('123456789ABCDEFGHJKLMNPQRSTWUVXYZ', 8);

// A date cell reaches us as a Date at local midnight, a text cell as a string. toDateString formats
// in local time, so both land on the day the spreadsheet shows; toISOString would roll a date cell
// back a day on any server east of UTC.
const toSheetDateString = value =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? toDateString(value) : value;

const getPaymentStatus = (amount, planCoverageTotal) => {
  if (amount === 0) return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED;
  if (amount === round(planCoverageTotal, 2)) return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID;
  return INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL;
};

const insurancePlanPaymentImportSchema = z
  .object({
    id: z.string().uuid(),
    date: z.preprocess(toSheetDateString, z.iso.date()),
    amount: z.coerce
      .number()
      .min(0)
      .transform(amount => round(amount, 2)),
    invoiceNumber: z.string(),
    invoiceInsurancePlanId: z.string(),
    reason: z.string().optional(),
  })
  .strip()
  .transform(data => ({
    ...data,
    receiptNumber: receiptNumberGenerator(),
  }));

export async function insurancePlanPaymentImporter({
  errors,
  models,
  stats,
  file,
  checkPermission,
}) {
  checkPermission('create', 'InvoicePayment');
  const workbook = parseExcel(file);

  const sheet = Object.values(workbook).at(0);
  const sheetName = Object.keys(workbook).at(0);
  const subStat = {};
  if (!sheet) {
    throw new Error('No sheet found in workbook');
  }

  for await (const [index, row] of sheet.entries()) {
    const { data, error } = await insurancePlanPaymentImportSchema.safeParseAsync(row);

    if (error) {
      errors.push(new ValidationError(sheetName, index, error));
      continue;
    }

    const matchingInvoices = await models.Invoice.findAll({
      where: { displayId: data.invoiceNumber },
      include: models.Invoice.getFullReferenceAssociations(),
      limit: 2,
    });

    if (matchingInvoices.length === 0) {
      errors.push(
        new ValidationError(sheetName, index, `Invoice '${data.invoiceNumber}' not found`),
      );
      continue;
    }

    if (matchingInvoices.length > 1) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Multiple invoices found with number '${data.invoiceNumber}'`,
        ),
      );
      continue;
    }

    const [invoice] = matchingInvoices;

    if (invoice.status !== INVOICE_STATUSES.FINALISED) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Invoice '${data.invoiceNumber}' has status '${invoice.status}' but must be finalised`,
        ),
      );
      continue;
    }

    const invoicePlanIds = (invoice?.insurancePlans ?? []).map(plan => plan.id);
    if (!invoicePlanIds.includes(data.invoiceInsurancePlanId)) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Insurance plan '${data.invoiceInsurancePlanId}' is not attached to invoice '${data.invoiceNumber}'. Attached plans: ${invoicePlanIds.join(', ') || 'none'}`,
        ),
      );
      continue;
    }

    // Invoice items carry no insurance plan rows of their own, so the coverage the invoice screen
    // shows has to be built before any of it can be totalled.
    const pricedInvoice = {
      ...invoice.get({ plain: true }),
      items: (invoice.items ?? []).map(item => ({
        ...item.get({ plain: true }),
        insurancePlanItems: getInsurancePlanItemsForInvoiceItem(item, invoice.insurancePlans),
      })),
    };

    const {
      insuranceCoverageTotal: allPlansCoverageTotal,
      insurancePlanPaymentsTotal: allPlanPaymentsTotal,
    } = getInvoiceSummary(pricedInvoice);
    const { planCoverageTotal, planPaymentRemainingBalance } = getInsurancePlanPaymentBalance(
      pricedInvoice,
      data.invoiceInsurancePlanId,
    );

    const existingPayment = await models.InvoiceInsurancePlanPayment.findByPk(data.id, {
      include: models.InvoiceInsurancePlanPayment.getFullReferenceAssociations(),
    });

    if (existingPayment && existingPayment.detail.invoiceId !== invoice.id) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Payment '${data.id}' already exists on a different invoice, so it cannot be moved to invoice '${data.invoiceNumber}'`,
        ),
      );
      continue;
    }

    // Only an amount already recorded against this same plan frees up balance for the new amount.
    // Moving a payment between two of the invoice's plans leaves the old amount counting against
    // the plan it came from, so there is nothing to credit back.
    const creditedAmount =
      existingPayment?.invoiceInsurancePlanId === data.invoiceInsurancePlanId
        ? existingPayment.detail.amount
        : 0;
    const maxAmount = round(
      new Decimal(planPaymentRemainingBalance).add(creditedAmount).toNumber(),
      2,
    );

    if (data.amount > maxAmount) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Payment amount $${data.amount} exceeds the remaining balance of $${maxAmount} for plan '${data.invoiceInsurancePlanId}' on invoice '${data.invoiceNumber}'`,
        ),
      );
      continue;
    }

    try {
      if (existingPayment) checkPermission('write', 'InvoicePayment');

      await models.Invoice.sequelize.transaction(async () => {
        if (existingPayment) {
          await models.InvoicePayment.update(
            {
              date: data.date,
              amount: data.amount,
            },
            { where: { id: existingPayment.invoicePaymentId } },
          );

          await models.InvoiceInsurancePlanPayment.update(
            {
              invoiceInsurancePlanId: data.invoiceInsurancePlanId,
              reason: data.reason,
              status: getPaymentStatus(data.amount, planCoverageTotal),
            },
            { where: { id: existingPayment.id } },
          );
        } else {
          const payment = await models.InvoicePayment.create(
            {
              invoiceId: invoice.id,
              date: data.date,
              receiptNumber: data.receiptNumber,
              amount: data.amount,
            },
            { returning: true },
          );
          await models.InvoiceInsurancePlanPayment.create({
            id: data.id,
            invoicePaymentId: payment.id,
            invoiceInsurancePlanId: data.invoiceInsurancePlanId,
            reason: data.reason,
            status: getPaymentStatus(data.amount, planCoverageTotal),
          });
        }

        await models.Invoice.update(
          {
            insurancePlanPaymentStatus: getInvoiceInsurancePlanPaymentStatus(
              new Decimal(allPlanPaymentsTotal)
                .minus(existingPayment?.detail.amount ?? 0)
                .add(data.amount)
                .toNumber(),
              allPlansCoverageTotal,
            ),
          },
          { where: { id: invoice.id } },
        );
      });

      updateStat(
        subStat,
        statkey('InvoiceInsurancePlanPayment', sheetName),
        existingPayment ? 'updated' : 'created',
      );
    } catch (e) {
      errors.push(
        new ValidationError(
          sheetName,
          index,
          `Failed to process payment for invoice '${data.invoiceNumber}': ${e.message}`,
        ),
      );
    }
  }

  stats.push(subStat);
}
