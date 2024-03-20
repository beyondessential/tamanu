import { setLocale } from 'yup';
import { capitaliseFirstLetter } from './capitalise';

const REQUIRED_MESSAGE_STRING_ID = 'general.validation.required';

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
        const translatedPath =
          translations[`general.validation.path.${path}`] || splitFieldName(path);
        return defaultMessage.replace(':path', translatedPath);
      },
    },
  });
}
