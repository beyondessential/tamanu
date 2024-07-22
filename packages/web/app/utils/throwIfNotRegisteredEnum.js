import { getEnumPrefix, isRegisteredEnum } from '../../../shared/src/utils/enumRegistry';

export const throwIfNotRegisteredEnum = (enumValues, fieldName) => {
  if (!isRegisteredEnum(enumValues)) {
    throw new Error(
      `enumValues ${
        fieldName ? `for field ${fieldName} ` : ''
      }are not registered in enumRegistry: ${JSON.stringify(enumValues)} `,
    );
  }
  if (!getEnumPrefix(enumValues)) {
    throw new Error(
      `enumValues for ${
        fieldName ? `for field ${fieldName} ` : ''
      }has no associated prefix: ${JSON.stringify(enumValues)}`,
    );
  }
};
