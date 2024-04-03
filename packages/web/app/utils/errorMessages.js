import * as yup from 'yup';
import { capitaliseFirstLetter } from './capitalise';
import { replaceStringVariables } from '../contexts/Translation';

const REQUIRED_MESSAGE_STRING_ID = 'validation.required';
const REQUIRED_MESSAGE_FALLBACK = 'The :path field is required';

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

export function registerYup(translations = {}) {
  yup.addMethod(yup.mixed, 'translatedLabel', function(translatedTextComponent) {
    const { stringId, fallback } = translatedTextComponent.props;
    const templateString = translations[stringId] || fallback;
    const replaced = replaceStringVariables(
      { ...translatedTextComponent.props, templateString },
      translations,
    );
    return this.label(replaced);
  });
  const defaultMessage = translations[REQUIRED_MESSAGE_STRING_ID] || REQUIRED_MESSAGE_FALLBACK;
  yup.setLocale({
    mixed: {
      required: function({ path }) {
        return defaultMessage.replace(':path', splitFieldName(path));
      },
    },
  });
}
