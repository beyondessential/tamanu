import { QueryInterface } from 'sequelize';

// Renaming insurer payments to insurance plan payments moved the string ids this copy is
// translated under. A deployment that has translated any of them would otherwise fall back to
// English with no sign of why, so carry the existing text across to the new ids.
//
// Matched by prefix: the entry ending in a dot covers one id per payment status, and the two whole
// ids have nothing else extending them.
const RENAMED_STRING_ID_PREFIXES = [
  ['adminSidebar.insurerPayments', 'adminSidebar.insurancePlanPayments'],
  ['invoice.modal.payment.insurerPayments', 'invoice.modal.payment.insurancePlanPayments'],
  ['invoice.property.insurerPaymentStatus.', 'invoice.property.insurancePlanPaymentStatus.'],
];

export async function up(query: QueryInterface): Promise<void> {
  for (const [oldPrefix, newPrefix] of RENAMED_STRING_ID_PREFIXES) {
    await query.sequelize.query(
      `
      INSERT INTO translated_strings (string_id, language, text)
      SELECT :newPrefix || substring(string_id from :suffixFrom), language, text
      FROM translated_strings
      WHERE string_id LIKE :pattern
      ON CONFLICT (string_id, language) DO NOTHING
      `,
      {
        replacements: {
          newPrefix,
          suffixFrom: oldPrefix.length + 1,
          pattern: `${oldPrefix}%`,
        },
      },
    );
  }
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: a translation edited against the new id since this ran is dropped rather than
  // copied back, because there is no way to tell it apart from the one this migration created.
  for (const [, newPrefix] of RENAMED_STRING_ID_PREFIXES) {
    await query.sequelize.query(`DELETE FROM translated_strings WHERE string_id LIKE :pattern`, {
      replacements: { pattern: `${newPrefix}%` },
    });
  }
}
