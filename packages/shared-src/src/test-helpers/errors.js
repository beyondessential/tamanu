export async function showError(fn) {
  try {
    if (typeof fn === 'function') {
      return await fn();
    } else {
      return await fn;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    throw err;
  }
}
