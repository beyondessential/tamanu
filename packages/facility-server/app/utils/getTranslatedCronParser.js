import cronstrue from 'cronstrue';
import { en as EnglishLocale } from 'cronstrue/locales/en';

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

const registerCustomLocale = async (models, language) => {
  const tt = await models.TranslatedString.getTranslationFunction(language);
  cronstrue.locales.custom = new CustomTranslatedLocale(tt);
};

export const getTranslatedCronParser = async (models, language) => {
  if (!cronstrue.locales.custom) {
    await registerCustomLocale(models, language);
  }
  return schedule => cronstrue.toString(schedule, { locale: 'custom' });
};
