/**
 * Something compact, identifiable as ours, and easy to decode into useful data.
 *
 * @param {string} vaccinationId
 * @param {string} countryCode
 * @returns {string}
 */
export function generateDefaultFormatUVCI(vaccinationId, countryCode) {
  const id = Buffer.from(vaccinationId.replace(/-/g, ''), 'hex')
    .toString('base64')
    .replace(/=/g, '');
  return `TAMANU1/${countryCode}/${id}`;
}
