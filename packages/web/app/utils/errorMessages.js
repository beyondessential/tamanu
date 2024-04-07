import { setLocale } from 'yup';
import { capitaliseFirstLetter } from './capitalise';

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

export function registerYup() {
  setLocale({
    mixed: {
      required: ({ path }) => `${splitFieldName(path)} is required`,
    },
  });
}
