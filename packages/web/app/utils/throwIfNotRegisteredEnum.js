import { getEnumPrefix, isRegisteredEnum } from '@tamanu/shared';

export const throwIfNotRegisteredEnum = (enumValues, fieldName) => {
  if (!isRegisteredEnum(enumValues)) {
    throw new Error(
      `enumValues for ${
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
