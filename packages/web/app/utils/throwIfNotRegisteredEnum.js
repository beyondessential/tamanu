import { getEnumPrefix, isRegisteredEnum } from '../../../shared/src/utils/enumRegistry';

export const throwIfNotRegisteredEnum = (enumValues, name) => {
  if (!isRegisteredEnum(enumValues)) {
    throw new Error(
      `enumValues ${
        name ? `for field ${name} ` : ''
      }are not registered in enumRegistry: ${JSON.stringify(enumValues)} `,
    );
  }
  if (!getEnumPrefix(enumValues)) {
    throw new Error(
      `enumValues for ${name ? `for field ${name} ` : ''}has no associated prefix: ${JSON.stringify(
        enumValues,
      )}`,
    );
  }
};
