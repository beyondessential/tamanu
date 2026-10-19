import { matchPath, useLocation } from 'react-router';

/**
 * Params of an ancestor route pattern. `useParams` only sees the route that matched, so anything
 * rendered above it — or matching a shorter pattern than the current URL — has to match by hand.
 */
export const getRouteParams = (path, pathname) =>
  matchPath({ path, end: false }, pathname)?.params ?? {};

export const useRouteParams = path => getRouteParams(path, useLocation().pathname);
