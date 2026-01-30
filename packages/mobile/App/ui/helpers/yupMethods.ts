import * as yup from 'yup';
import { replaceStringVariables } from '../contexts/TranslationContext';

let isMethodRegistered = false;

const registerTranslatedLabelMethod = (translations: object = {}) => {
  const methodImpl = function(translatedTextComponent) {
    if (!translations) return this.label(translatedTextComponent.props.fallback);
    const { stringId, fallback } = translatedTextComponent.props;
    const templateString = translations[stringId] || fallback;
    const replaced = replaceStringVariables(
      templateString,
      translatedTextComponent.props.replacements,
      translations,
    );
    return this.label(replaced);
  };

  if (!isMethodRegistered) {
    yup.addMethod(yup.mixed, 'translatedLabel', methodImpl);
    isMethodRegistered = true;
  } else {
    (yup.mixed.prototype as any).translatedLabel = methodImpl;
  }
};

registerTranslatedLabelMethod();

export function registerYup(translations: object = {}) {
  registerTranslatedLabelMethod(translations);
  const defaultMessage = translations['validation.required'] || 'The :path field is required';
  yup.setLocale({
    mixed: {
      required: function({ path }) {
        return defaultMessage.replace(':path', path);
      },
    },
  });
}
