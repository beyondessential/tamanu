import cronstrue from 'cronstrue';
import { en as EnglishLocale } from 'cronstrue/locales/en';
import { useTranslation } from '../contexts/Translation';

/**
 * Connect translated strings to cron parser for custom translations
 * This only supports every n seconds, minutes, hours right now but see the base locale for more
 * If we expect the parsing of other cron expressions, we need to add more methods here
 */
class CustomTranslatedLocale extends EnglishLocale {
  constructor(getTranslation) {
    super();
    this.getTranslation = getTranslation;
  }

  everyX0Seconds() {
    return this.getTranslation('schedule.everyNSeconds', 'every %s seconds');
  }
  everyX0Minutes() {
    return this.getTranslation('schedule.everyNMinutes', 'every %s minutes');
  }
  everyX0Hours() {
    return this.getTranslation('schedule.everyNHours', 'every %s hours');
  }
}

export const useParsedCronExpression = (expression) => {
  const { getTranslation } = useTranslation();

  // Register during render (idempotent global), not in an effect: an effect
  // only runs after the first paint, leaving the preview blank until a
  // re-render.
  if (!cronstrue.locales.custom && getTranslation) {
    cronstrue.locales.custom = new CustomTranslatedLocale(getTranslation);
  }

  if (!expression || !cronstrue.locales.custom) return '';

  try {
    return cronstrue.toString(expression, { locale: 'custom' });
  } catch (e) {
    // Not a parseable cron expression (e.g. mid-typing in the settings editor)
    return null;
  }
};
