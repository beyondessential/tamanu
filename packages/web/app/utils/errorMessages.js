import { setLocale } from 'yup';
import { capitaliseFirstLetter } from './capitalise';

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

export function registerYup(defaultMessage = ':path is required') {
  setLocale({
    mixed: {
      required: ({ path }) => defaultMessage.replace(':path', splitFieldName(path)),
    },
  });
}
