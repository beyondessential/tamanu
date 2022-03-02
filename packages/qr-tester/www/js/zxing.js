//! Adapted from https://stackoverflow.com/questions/26356626/using-zxing-barcode-scanner-within-a-web-page

export async function openZXing({ timeout = 60000 } = {}) {
  let { href } = window.location;
  const ptr = href.lastIndexOf('#');
  if (ptr > 0) {
    href = href.slice(0, ptr);
  }

  const event = await new Promise((resolve, reject) => {
    window.addEventListener('storage', resolve, false);
    window.addEventListener('hashchange', resolve, false);
    setTimeout(() => {
      window.removeEventListener('storage');
      window.removeEventListener('hashchange');
      reject(new Error("Timeout"));
    }, timeout);

    localStorage.removeItem('barcode');
    if (navigator.userAgent.match(/Firefox/i)) {
      // Used for Firefox. If Chrome uses this, it raises the "hashchanged" event only.
      window.location.href = 'zxing://scan/?ret=' + encodeURIComponent(href + '#zx{CODE}');
    } else {
      // Used for Chrome. If Firefox uses this, it leaves the scan window open.
      window.open('zxing://scan/?ret=' + encodeURIComponent(href + '#zx{CODE}'));
    }
  });

  switch (event.type) {
    case 'hashchange':
      window.removeEventListener('hashchange');
      window.removeEventListener('storage');

      let { hash } = window.location;
      if (hash.slice(0, 3) === '#zx') {
        hash = hash.slice(3);
        window.location.hash = event.oldURL.split('#')[1] || '';
        return hash;
      }
      break;

    case 'storage':
      window.removeEventListener('hashchange');
      window.focus();

      if (event.key === 'barcode') {
        window.removeEventListener('storage');
        return event.newValue;
      }
      break;
  }

  throw new Error('zxing://scan failed');
}
