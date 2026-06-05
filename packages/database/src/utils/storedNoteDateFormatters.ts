import config from 'config';

import { formatShort, formatShortDateTime } from '@tamanu/utils/dateFormatters';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

import type { Setting } from '../models/Setting';

/**
 * Date formatters bound for system-note text — the model-layer counterpart of
 * the React datetime contexts, which can't be used outside a render tree.
 *
 * System notes are stored shared artifacts, so their date formatting follows
 * the deployment convention (dateTimeLocale setting ?? server locale), never
 * the locale of whichever browser triggered the change.
 */
export async function getStoredNoteDateFormatters(SettingModel: typeof Setting) {
  const locale = (await SettingModel.get('dateTimeLocale')) as string | undefined;
  const primaryTimeZone = getPrimaryTimeZone(config);
  return {
    formatShort: (date: string) => formatShort(date, primaryTimeZone, null, locale),
    formatShortDateTime: (date: string) => formatShortDateTime(date, primaryTimeZone, null, locale),
  };
}
