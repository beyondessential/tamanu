import { setLocale } from 'yup';
import { capitaliseFirstLetter } from './capitalise';
import { startCase } from 'lodash';

const REQUIRED_MESSAGE_STRING_ID = 'validation.required';
const LOCALISATION_TEMPLATE_STRING = ':localisedField=';

export const localisedErrorLabel = path => `:${LOCALISATION_TEMPLATE_STRING}.${path}`;

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

export function registerYup(translations = {}) {
  const defaultMessage = translations[REQUIRED_MESSAGE_STRING_ID] || 'The :path field is required';
  setLocale({
    mixed: {
      required: ({ path }) => {
        if (path.includes(LOCALISATION_TEMPLATE_STRING)) {
          const [prefix, suffix] = path.split(LOCALISATION_TEMPLATE_STRING);
          const start = startCase(prefix);
          const translatedLocalisation = translations[`general.localisedField.${suffix}`] || suffix;
          return defaultMessage.replace(
            ':path',
            `${start ? `${start} ` : ''}${translatedLocalisation}`,
          );
        }
        return defaultMessage.replace(
          ':path',
          translations[`validation.path.${path}`] || splitFieldName(path),
        );
      },
    },
  });
}
