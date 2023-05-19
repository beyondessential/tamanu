export function withErrorShown(fn) {
  return () => showError(fn);
}

export async function showError(fn) {
  try {
    return await (typeof fn === 'function' ? fn() : fn);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    throw err;
  }
}
