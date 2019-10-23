import { setLocale } from 'yup';

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(" ");
  const joined = fieldNameAsWords.slice(0, 1).toUpperCase() + fieldNameAsWords.slice(1).toLowerCase();
  return joined;
}

export function registerYup() {
  setLocale({
    mixed: {
      required: ({ path }) => `${splitFieldName(path)} is required`,
    },
  });
}
