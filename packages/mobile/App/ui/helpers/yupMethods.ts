import * as yup from 'yup';
import { replaceStringVariables } from '../contexts/TranslationContext';

const registerTranslatedLabelMethod = (translations: object = {}) => {
  yup.addMethod(yup.mixed, 'translatedLabel', function(translatedTextComponent) {
    if (!translations) return this.label(translatedTextComponent.props.fallback);
    const { stringId, fallback } = translatedTextComponent.props;
    const templateString = translations[stringId] || fallback;
    const replaced = replaceStringVariables(
      templateString,
      translatedTextComponent.props.replacements,
      translations,
    );
    return this.label(replaced);
  });
};

// Register a placeholder method in upper scope to be replaced with
// translated version, this is required at boot
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
