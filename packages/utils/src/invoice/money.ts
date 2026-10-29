import Decimal from 'decimal.js';

/**
 * Round an amount of money to the cent, with halves rounded away from zero.
 *
 * Every line of an invoice is rounded to the cent before anything is summed, so the totals always
 * equal the sum of the lines shown and reconcile to the cent against other systems.
 */
export const roundToCents = (amount: Decimal.Value): Decimal =>
  new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
