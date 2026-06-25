import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

const TAB_SEARCH_PARAM = 'tab';

/**
 * Keeps the selected UI tab in the `tab` URL search param (replace navigation).
 * Ensures browser Back from child routes returns to the parent with the same tab selected.
 *
 * @param {string[]} visibleTabKeys — tab keys currently shown (e.g. from permissions / settings)
 * @param {string | undefined} fallbackTabKey — default when URL has no tab or an unknown tab
 * @returns {{ currentTab: string | undefined, onTabSelect: (tabKey: string) => void }}
 */
export function useSyncedTabSearchParam(visibleTabKeys, fallbackTabKey) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get(TAB_SEARCH_PARAM);

  const currentTab = useMemo(() => {
    if (!fallbackTabKey || !visibleTabKeys.length) {
      return fallbackTabKey;
    }
    if (tabFromUrl && visibleTabKeys.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return fallbackTabKey;
  }, [tabFromUrl, visibleTabKeys, fallbackTabKey]);

  useEffect(() => {
    if (!fallbackTabKey || !visibleTabKeys.length) {
      return;
    }
    if (tabFromUrl === currentTab) {
      return;
    }
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set(TAB_SEARCH_PARAM, currentTab);
        return next;
      },
      { replace: true },
    );
  }, [tabFromUrl, currentTab, fallbackTabKey, visibleTabKeys, setSearchParams]);

  const onTabSelect = useCallback(
    tabKey => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set(TAB_SEARCH_PARAM, tabKey);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { currentTab, onTabSelect };
}
