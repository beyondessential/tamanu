import * as yup from 'yup';
import { capitaliseFirstLetter } from './capitalise';
import { startCase } from 'lodash';
import { replaceStringVariables } from '../contexts/Translation';

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
  function generateLabel(tt) {
    const { stringId, fallback, replacements, lowercase, uppercase } = tt.props;
    const label = translations[stringId] || fallback;
    const replaced = replaceStringVariables(
      label,
      replacements,
      translations,
      uppercase,
      lowercase,
    );
    return label(replaced);
  }
  yup.addMethod(yup.mixed, 'translatedLabel', generateLabel);
  yup.addMethod(yup.mixed, 'localisedLabel', function(fieldName, fallback) {
    const translated = translations[`general.localisedField.${fieldName}`];
    const label = translated ? path.replace(new RegExp(fieldName, 'i'), translated) : path;
    return this.label(label);
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
