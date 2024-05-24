import cronstrue from 'cronstrue';
import { en as EnglishLocale } from 'cronstrue/locales/en';
import { useTranslation } from '../contexts/Translation';
import { useEffect } from 'react';

/**
 * Connect translated strings to cron parser for custom translations
 * This only supports every n seconds, minutes, hours right now but see the base locale for more
 * If we expect the parsing of other cron expressions, we need to add more methods here
 */
class CustomTranslatedLocale extends EnglishLocale {
  constructor(tt) {
    super();
    this.tt = tt;
  }

  everyX0Seconds() {
    return this.tt('schedule.everyNSeconds', 'every %s seconds');
  }
  everyX0Minutes() {
    return this.tt('schedule.everyNMinutes', 'every %s minutes');
  }
  everyX0Hours() {
    return this.tt('schedule.everyNHours', 'every %s hours');
  }
}

export const useParsedCronExpression = expression => {
  const { getTranslation } = useTranslation();

  useEffect(() => {
    if (cronstrue.locales.custom || !getTranslation) return;
    cronstrue.locales.custom = new CustomTranslatedLocale(getTranslation);
  }, [getTranslation]);

  if (!expression) return '';

  return cronstrue.toString(expression, { locale: 'custom' });
};
