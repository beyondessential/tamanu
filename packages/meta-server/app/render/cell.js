import { sanitise } from './sanitise';

export const getUrl = dirtyUrl => {
  const url = sanitise(dirtyUrl);
  return `<a href="${url}">${sanitise(url)}</a>`;
};

export const getBool = bool =>
  bool
    ? '<div style="background-color: green; color: white; padding: 2px; width: 30px;">Yes</div>'
    : '<div style="background-color: red; color: white; padding: 2px; width: 30px">No</div>';

export const getMilliseconds = ms => (Number.isFinite(ms) ? `${ms}ms` : '');
