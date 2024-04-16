import * as yup from 'yup';
import { capitaliseFirstLetter } from './capitalise';
import { replaceStringVariables } from '../contexts/Translation';

const camelCaseTest = /(?=[A-Z])/;
function splitFieldName(name) {
  const splitField = name.split(camelCaseTest);
  const fieldNameAsWords = splitField.join(' ');
  const joined = capitaliseFirstLetter(fieldNameAsWords.toLowerCase());
  return joined;
}

const registerTranslatedLabelMethod = (translations = {}) => {
  yup.addMethod(yup.mixed, 'translatedLabel', function(translatedTextComponent) {
    if (!translations) return this.label(translatedTextComponent.props.fallback);
    const { stringId, fallback } = translatedTextComponent.props;
    const templateString = translations[stringId] || fallback;
    const replaced = replaceStringVariables(
      templateString,
      translatedTextComponent.props,
      translations,
    );
    return this.label(replaced);
  });
};

// Register a placeholder method in upper scope to be replaced with
// translated version, this is required at boot
registerTranslatedLabelMethod();

export function registerYup(translations = {}) {
  registerTranslatedLabelMethod(translations);
  const defaultMessage = translations['validation.required'] || 'The :path field is required';
  yup.setLocale({
    mixed: {
      required: function({ path }) {
        return defaultMessage.replace(':path', splitFieldName(path));
      },
    },
  });
}
