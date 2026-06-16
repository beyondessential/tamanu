import config from 'config';

import { formatShort, formatShortDateTime } from '@tamanu/utils/dateFormatters';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';

import type { Setting } from '../models/Setting.ts';

/**
 * Date formatters bound for system-note text — the model-layer counterpart of
 * the React datetime contexts, which can't be used outside a render tree.
 *
 * System notes are stored shared artifacts, so their date formatting follows
 * the deployment convention (dateTimeLocale setting ?? server locale), never
 * the locale of whichever browser triggered the change.
 *
 * The setting is resolved lazily on first format and memoised only for the
 * lifetime of the returned formatter set — i.e. a single update() call — so
 * updates that don't change any date column don't pay a settings read, while
 * setting changes still apply from the very next update.
 */
export function getStoredNoteDateFormatters(SettingModel: typeof Setting) {
  let localePromise: Promise<string | undefined> | undefined;
  const locale = () =>
    (localePromise ??= SettingModel.get('dateTimeLocale').then(
      value => value as string | undefined,
    ));
  const primaryTimeZone = getPrimaryTimeZone(config);
  return {
    formatShort: async (date: string) => formatShort(date, primaryTimeZone, null, await locale()),
    formatShortDateTime: async (date: string) =>
      formatShortDateTime(date, primaryTimeZone, null, await locale()),
  };
}
