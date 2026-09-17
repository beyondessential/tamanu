import * as yup from 'yup';
import { numeralTranslation } from '@tamanu/shared/utils/numeralTranslation';
import { isNaN } from 'es-toolkit/compat';

// Foreign keys used to be more complicated nested objects requiring custom
// validation, but they're just strings now. We could remove these validators entirely,
// but there's a benefit to having these field types explicitly treated differently
// (note that an invalid FK will still be rejected by the server,
// so there's no safety issue here)
export const foreignKey = message => yup.string().required(message);
export const optionalForeignKey = () => yup.string();

/** A blank number input hands back '', which yup would otherwise cast to NaN and reject. */
export const emptyToNull = (value, originalValue) => (originalValue === '' ? null : value);

/**
 * A medication being sent to pharmacy is dispensing at least one of something. Reads the
 * `sendToPharmacy` sibling of the quantity field, so both live on the same object.
 */
export const atLeastOneWhenSendingToPharmacy = message => ({
  name: 'atLeastOneWhenSendingToPharmacy',
  message,
  test(quantity) {
    return !this.parent?.sendToPharmacy || quantity >= 1;
  },
});

/**
 * A dispensing quantity, shared by the prescription form and the discharge form's medication tables
 * so the two read the same. The field can be left blank: a quantity is only demanded, and only has
 * to be at least one, when the medication is being sent to pharmacy. A blank quantity is recorded as
 * zero by the server. Call `translatedLabel` on the result to name the field in its error messages.
 */
export const dispensingQuantitySchema = requiredInlineMessage =>
  yup
    .number()
    .transform(emptyToNull)
    .integer()
    .min(0)
    .nullable()
    .test(atLeastOneWhenSendingToPharmacy(requiredInlineMessage));

export const yupAttemptTransformToNumber = (value, originalValue) => {
  if (originalValue === null || originalValue === undefined) return value;
  const translationValue = numeralTranslation(originalValue);
  return isNaN(value) ? translationValue : value;
};
