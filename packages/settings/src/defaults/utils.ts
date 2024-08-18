import { mapValues, isObject } from 'lodash';
import * as yup from 'yup';

export const extractDefaults = settings => {
  return mapValues(settings, (value: { schema: yup.SchemaOf<any>; default: any }) => {
    if (isObject(value) && value.schema) {
      return value.default;
    } else if (isObject(value)) {
      return extractDefaults(value);
    }
    return value;
  });
};
