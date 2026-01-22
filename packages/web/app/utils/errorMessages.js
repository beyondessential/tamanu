import * as yup from 'yup';
import { replaceStringVariables } from '@tamanu/shared/utils/translation';

const registerTranslatedLabelMethod = (translations = {}) => {
  yup.addMethod(yup.mixed, 'translatedLabel', function (translatedTextComponent) {
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
  // We now just show the *Required message for every validation field instead of using translatedLabel
  const defaultMessage = translations['validation.required.inline'] || '*Required';
  yup.setLocale({
    mixed: {
      required: function () {
        return defaultMessage;
      },
    },
  });
}
