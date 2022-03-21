export const MAIN_ML = '/js/csca/icao_ml_20jan22.pem';
export const HEALTH_ML = '/js/csca/health_ml_31jan22.pem';

export default async function publicKeys(url) {
  const pems = (await fetch(url).then(r => r.text()))
    .split('-----END CERTIFICATE-----')
    .map(pem => pem.trim() + '-----END CERTIFICATE-----');

  const keys = [];
  for (const [n, pem] of pems.entries()) {
    try {
      keys.push(KEYUTIL.getKey(pem));
    } catch (e) {
      console.warn(`Failed to parse ${n}th certificate in ${url}:`, e);
    }
  }

  return keys;
}
