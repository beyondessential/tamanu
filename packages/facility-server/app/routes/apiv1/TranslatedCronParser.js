import { en as BaseLocale } from 'cronstrue/locales/en';

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
