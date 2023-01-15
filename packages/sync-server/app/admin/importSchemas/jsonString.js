import * as yup from 'yup';

export const jsonString = () =>
  // The template curly two lines down is valid in a yup message
  // eslint-disable-next-line no-template-curly-in-string
  yup.string().test('is-json', '${path} is not valid JSON', value => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  });

// Because jsonStringShape runs a new validation it runs at the root of the object
// This means default yup errors won't give the field name by default, so we pass it in instead
export const jsonStringShape = (name, objectShape) =>
  yup.string().test('json-shape', value => {
    let parseValue = value;
    // We usually accept empty strings for configs, but there might be required fields
    // So attempt the validation with an empty object just in case
    if (!value) parseValue = '{}';
    let parsedObject = null;
    try {
      parsedObject = JSON.parse(parseValue);
      // Will throw a validation error if shape doesn't match
      return objectShape.validateSync(parsedObject, { strict: true });
    } catch (e) {
      let errors = [];
      // ValidationError has multiple errors within
      if (e.errors) {
        errors = e.errors.map(err => `${name}: ${err}`);
      } else {
        // We land here if JSON.parse fails
        errors = [`${name}: ${e.message}`];
      }
      return new yup.ValidationError(errors);
    }
  });

// SurveyScreenComponent field types
export const configString = objectShape => jsonStringShape('config', objectShape);
export const validationString = objectShape => jsonStringShape('validationCriteria', objectShape);
