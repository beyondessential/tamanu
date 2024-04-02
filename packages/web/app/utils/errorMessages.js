import * as yup from 'yup';
import { capitaliseFirstLetter } from './capitalise';
import { startCase } from 'lodash';

const REQUIRED_MESSAGE_STRING_ID = 'validation.required';
const LOCALISATION_TEMPLATE_STRING = '@localisedField=';

export const localisedErrorLabel = path => `:${LOCALISATION_TEMPLATE_STRING}${path}`;

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

export function registerYup(translations = {}) {
  yup.addMethod(yup.mixed, 'localisedLabel', function(path, fieldName) {
    const translated = translations[`general.localisedField.${fieldName}`];
    if (!translated) {
      return this.label(path);
    }
    const defaultMessage = path.replace(
      new RegExp(fieldName, 'i'),
      translations[`general.localisedField.${fieldName}`],
    );
    return this.label(defaultMessage);
  });
  const defaultMessage = translations[REQUIRED_MESSAGE_STRING_ID] || 'The :path field is required';
  yup.setLocale({
    mixed: {
      required: function({ path }) {
        return defaultMessage.replace(':path', splitFieldName(path));
      },
    },
  });
}
