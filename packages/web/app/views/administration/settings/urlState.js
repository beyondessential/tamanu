// Deep-linkable editor state: scope, selection, and search live in the query
// string so a settings view can be shared or bookmarked. Written with
// replaceState — no history spam, and no router round-trip for state the
// route itself doesn't care about.

export const readUrlParam = key => new URLSearchParams(window.location.search).get(key);

export const writeUrlParams = updates => {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') params.delete(key);
    else params.set(key, value);
  }
  const search = params.toString();
  window.history.replaceState(
    // preserve the router's own history state
    window.history.state,
    '',
    `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
  );
};
