// Parses the `rules` cell (JSON text) into an object before handing it to Sequelize.
// Without this, Sequelize's JSONB serialiser JSON.stringify's the raw string, storing
// a JSON string literal rather than an object — every rule would then look empty at
// read time and every price list would match every encounter.
export function invoicePriceListLoader(item, { pushError } = {}) {
  // eslint-disable-next-line no-unused-vars
  const { note, rules, ...fields } = item;

  const parsedRules = parseRulesCell(rules, pushError);
  if (parsedRules === INVALID) return [];

  return [
    {
      model: 'InvoicePriceList',
      values: { ...fields, rules: parsedRules },
    },
  ];
}

const INVALID = Symbol('invalid-rules');

function parseRulesCell(raw, pushError) {
  if (raw == null || raw === '') return null;

  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;

  if (typeof raw !== 'string') {
    pushError?.(
      `rules must be a JSON object, got ${Array.isArray(raw) ? 'array' : typeof raw}`,
      'InvoicePriceList',
    );
    return INVALID;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    pushError?.(
      `rules is not valid JSON (${e.message}). Expected an object like {"patientAge": {"min": 65}}`,
      'InvoicePriceList',
    );
    return INVALID;
  }

  if (parsed === null) return null;

  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    pushError?.(
      `rules must be a JSON object, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`,
      'InvoicePriceList',
    );
    return INVALID;
  }

  return parsed;
}
