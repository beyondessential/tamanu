import * as yup from 'yup';
import { numeralTranslation } from '@tamanu/shared/utils/numeralTranslation';
import { isNaN } from 'lodash';

// Foreign keys used to be more complicated nested objects requiring custom
// validation, but they're just strings now. We could remove these validators entirely,
// but there's a benefit to having these field types explicitly treated differently
// (note that an invalid FK will still be rejected by the server,
// so there's no safety issue here)
export const foreignKey = (message) => yup.string().required(message);
export const optionalForeignKey = () => yup.string();

export const yupAttemptTransformToNumber = (value, originalValue) => {
  if (originalValue === null || originalValue === undefined) return value;
  const translationValue = numeralTranslation(originalValue);
  return isNaN(value) ? translationValue : value;
};
