import * as xlsx from 'xlsx';
import { chain } from 'lodash';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import {
  getInvoiceInsurancePlanPaymentStatus,
  getInvoiceSummary,
  round,
  getSpecificInsurancePlanPaymentRemainingBalance,
} from '@tamanu/utils/invoice';
import { INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
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

const insurancePlanPaymentImportSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string().date(),
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

export async function insurancePlanPaymentImporter({ errors, models, stats, file, checkPermission }) {
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

    const countInvoices = await models.Invoice.count({ where: { displayId: data.invoiceNumber } });
    if (!countInvoices) {
      errors.push(new ValidationError(sheetName, index, `Invoice '${data.invoiceNumber}' not found`));
      continue;
    }

    if (countInvoices > 1) {
      errors.push(new ValidationError(sheetName, index, `Multiple invoices found with number '${data.invoiceNumber}'`));
      continue;
    }

    const invoice = await models.Invoice.findOne({
      where: { displayId: data.invoiceNumber },
      include: models.Invoice.getFullReferenceAssociations(),
    });

    if (!invoice) {
      errors.push(new ValidationError(sheetName, index, `Invoice '${data.invoiceNumber}' not found`));
      continue;
    }

    if (invoice.status !== INVOICE_STATUSES.FINALISED) {
      errors.push(new ValidationError(sheetName, index, `Invoice '${data.invoiceNumber}' has status '${invoice.status}' but must be finalised`));
      continue;
    }

    const invoicePlanIds = (invoice?.insurancePlans ?? []).map(plan => plan.id);
    if (!invoicePlanIds.includes(data.invoiceInsurancePlanId)) {
      errors.push(new ValidationError(sheetName, index, `Insurance plan '${data.invoiceInsurancePlanId}' is not attached to invoice '${data.invoiceNumber}'. Attached plans: ${invoicePlanIds.join(', ') || 'none'}`));
      continue;
    }

    const {
      invoiceItemsTotal,
      insurancePlanPaymentsTotal: allPlanPaymentsTotal,
    } = getInvoiceSummary(invoice);
    const plans = (invoice?.insurancePlans ?? []).map(plan => ({
      invoiceInsurancePlanId: plan.id,
      percentage: (plan.defaultCoverage ?? 0) / 100,
    }));
    const allPlansCoverageTotal = round(
      plans.reduce((sum, plan) => sum.plus(new Decimal(invoiceItemsTotal).times(plan.percentage)), new Decimal(0)).toNumber(),
      2,
    );
    const { planDiscountTotal, planPaymentRemainingBalance } =
      getSpecificInsurancePlanPaymentRemainingBalance(
        plans,
        invoice?.payments ?? [],
        data.invoiceInsurancePlanId,
        invoiceItemsTotal,
      );

    try {
      const existingPayment = await models.InvoiceInsurancePlanPayment.findByPk(data.id, {
        include: models.InvoiceInsurancePlanPayment.getFullReferenceAssociations(),
      });
      if (existingPayment) {
        checkPermission('write', 'InvoicePayment');
        const maxAmount = round(
          new Decimal(planPaymentRemainingBalance)
            .add(existingPayment.detail.amount)
            .toNumber(),
          2,
        );
        if (data.amount > maxAmount) {
          errors.push(
            new ValidationError(sheetName, index, `Payment amount $${data.amount} exceeds the remaining balance of $${maxAmount} for plan '${data.invoiceInsurancePlanId}' on invoice '${data.invoiceNumber}'`),
          );
          continue;
        }
        await models.InvoicePayment.update(
          {
            invoiceId: invoice.id,
            date: data.date,
            amount: data.amount,
          },
          { where: { id: existingPayment.invoicePaymentId } },
        );

        await models.InvoiceInsurancePlanPayment.update(
          {
            invoiceInsurancePlanId: data.invoiceInsurancePlanId,
            reason: data.reason,
            status:
              data.amount === 0
                ? INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED
                : data.amount === round(planDiscountTotal, 2)
                  ? INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID
                  : INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL,
          },
          { where: { id: existingPayment.id } },
        );
        await models.Invoice.update(
          {
            insurancePlanPaymentStatus: getInvoiceInsurancePlanPaymentStatus(
              new Decimal(allPlanPaymentsTotal)
                .minus(existingPayment.detail.amount)
                .add(data.amount)
                .toNumber(),
              allPlansCoverageTotal,
            ),
          },
          { where: { id: invoice.id } },
        );

        updateStat(subStat, statkey('InvoiceInsurancePlanPayment', sheetName), 'updated');
      } else {
        const maxNewAmount = round(planPaymentRemainingBalance, 2);
        if (data.amount > maxNewAmount) {
          errors.push(
            new ValidationError(sheetName, index, `Payment amount $${data.amount} exceeds the remaining balance of $${maxNewAmount} for plan '${data.invoiceInsurancePlanId}' on invoice '${data.invoiceNumber}'`),
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
        await models.InvoiceInsurancePlanPayment.create({
          id: data.id,
          invoicePaymentId: payment.id,
          invoiceInsurancePlanId: data.invoiceInsurancePlanId,
          reason: data.reason,
          status:
            data.amount === 0
              ? INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED
              : data.amount === round(planDiscountTotal, 2)
                ? INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID
                : INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PARTIAL,
        });
        await models.Invoice.update(
          {
            insurancePlanPaymentStatus: getInvoiceInsurancePlanPaymentStatus(
              new Decimal(allPlanPaymentsTotal).add(data.amount).toNumber(),
              allPlansCoverageTotal,
            ),
          },
          { where: { id: invoice.id } },
        );

        updateStat(subStat, statkey('InvoiceInsurancePlanPayment', sheetName), 'created');
      }
    } catch (e) {
      errors.push(new ValidationError(sheetName, index, `Failed to process payment for invoice '${data.invoiceNumber}': ${e.message}`));
    }
  }

  stats.push(subStat);
}
