import { useMemo } from 'react';

import { useSettings } from '../contexts/SettingsContext';
import { formatDateForDisplay, formatStringDateForDisplay } from '../helpers/date';

/**
 * Locale-bound display date formatters: the dateTimeLocale setting pins the
 * deployment-wide formatting convention, otherwise dates follow the device
 * locale — mirroring the web datetime context's resolution chain.
 */
export const useDateFormatter = () => {
  const { getSetting } = useSettings();
  // SettingsContext defaults to an empty object outside its provider (e.g.
  // isolated component tests), so tolerate a missing getSetting.
  const localeSetting = getSetting?.<string>('dateTimeLocale');
  const locale = localeSetting ?? undefined;

  return useMemo(
    () => ({
      /** Effective formatting locale (dateTimeLocale setting ?? device locale) */
      locale: locale ?? new Intl.DateTimeFormat().resolvedOptions().locale,
      formatDate: (date: Date, dateFormat: string): string =>
        formatDateForDisplay(date, dateFormat, locale),
      formatStringDate: (date: string, dateFormat: string): string =>
        formatStringDateForDisplay(date, dateFormat, locale),
    }),
    [locale],
  );
};
