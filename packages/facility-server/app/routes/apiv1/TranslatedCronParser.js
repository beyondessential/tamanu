import { en as BaseLocale } from 'cronstrue/locales/en';

/**
 * Connect translated strings to cron parser for custom translations
 * This only supports every n seconds, minutes, hours right now but see the base locale for more
 */
export class TranslatedCronParser extends BaseLocale {
  constructor(translationFunc) {
    super();
    this.tt = translationFunc;
  }
  everyX0Seconds() {
    return this.tt('cron.everyNSeconds', 'every %s seconds');
  }
  everyX0Minutes() {
    return this.tt('cron.everyNMinutes', 'every %s minutes');
  }
  everyX0Hours() {
    return this.tt('cron.everyNHours', 'every %s hours');
  }
}
