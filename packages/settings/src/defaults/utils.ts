import _ from 'lodash';
import * as yup from 'yup';

export const extractDefaults = settings => {
  return _.mapValues(settings, (value: { schema: yup.SchemaOf<any>; default: any }) => {
    if (_.isObject(value) && value.schema) {
      return value.default;
    } else if (_.isObject(value)) {
      return extractDefaults(value);
    }
    return value;
  });
};
