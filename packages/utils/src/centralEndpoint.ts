// spec: CEND
const INTERNAL_HOST_SUFFIXES = [
  '.local',
  '.internal',
  '.lan',
  '.home.arpa',
  '.intranet',
  '.corp',
  '.private',
  '.ts.net',
];

const ALLOWED_PROTOCOLS = ['https:', 'http:'];

export type CentralEndpointValidation =
  | { isValid: true; endpoint: string }
  | { isValid: false; reason: string };

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isIPv4(address: string): boolean {
  const match = IPV4_PATTERN.exec(address);
  return match !== null && match.slice(1).every(octet => Number(octet) <= 255);
}

function isInternalIPv4(address: string): boolean {
  const [first, second] = address.split('.').map(Number);
  return (
    first === 10 || // private
    first === 127 || // loopback
    (first === 169 && second === 254) || // link-local
    (first === 172 && second >= 16 && second <= 31) || // private
    (first === 192 && second === 168) || // private
    (first === 100 && second >= 64 && second <= 127) // CGNAT, used by Tailscale
  );
}

function isInternalIPv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === '::1') return true; // loopback
  // IPv4-mapped (::ffff:a.b.c.d) takes the verdict of the embedded IPv4
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isInternalIPv4(mapped[1]!);
  // WHATWG URL normalises ::ffff:1.2.3.4 into hex groups (::ffff:102:304)
  const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1]!, 16);
    const low = parseInt(mappedHex[2]!, 16);
    return isInternalIPv4(`${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`);
  }
  return (
    /^f[cd][0-9a-f]{2}:/.test(lower) || // fc00::/7 unique local, including Tailscale's fd7a:115c:a1e0::/48
    /^fe[89ab][0-9a-f]:/.test(lower) // fe80::/10 link-local
  );
}

/**
 * Whether a host lies off the public internet: a name with no dot, a name under a conventional
 * internal suffix, or a bare IP address in a private, loopback, link-local or Tailscale range.
 * Accepts a hostname as found in `URL#hostname`, so IPv6 addresses may be bracketed.
 */
export function isInternalHost(host: string): boolean {
  const bare = host.replace(/^\[(.*)\]$/, '$1').toLowerCase();
  if (bare === '') return false;

  if (isIPv4(bare)) return isInternalIPv4(bare);
  // a colon cannot appear in a hostname, so this can only be an IPv6 address
  if (bare.includes(':')) return isInternalIPv6(bare);

  const withoutTrailingDot = bare.replace(/\.$/, '');
  if (!withoutTrailingDot.includes('.')) return true;
  return INTERNAL_HOST_SUFFIXES.some(suffix => withoutTrailingDot.endsWith(suffix));
}

/**
 * Parses a central endpoint and returns it in canonical form: scheme, lowercased host, optional
 * port. No path, query, fragment or credentials; a trailing slash is ignored.
 * Does not apply the plain-http policy, see `normaliseCentralEndpoint`.
 */
export function parseCentralEndpoint(input: string): CentralEndpointValidation {
  if (typeof input !== 'string' || input.trim() === '') {
    return { isValid: false, reason: 'Endpoint must be a URL' };
  }

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { isValid: false, reason: 'Endpoint must be a valid URL' };
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { isValid: false, reason: 'Endpoint must use https or http' };
  }
  if (url.username !== '' || url.password !== '') {
    return { isValid: false, reason: 'Endpoint must not contain credentials' };
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    return { isValid: false, reason: 'Endpoint must not contain a path, query or fragment' };
  }
  // new URL() accepts and drops an empty query or fragment, so check the raw input too
  if (/[?#]/.test(input)) {
    return { isValid: false, reason: 'Endpoint must not contain a path, query or fragment' };
  }

  return { isValid: true, endpoint: `${url.protocol}//${url.host}` };
}

/**
 * As `parseCentralEndpoint`, and plain `http` is only valid for internal hosts.
 */
export function normaliseCentralEndpoint(input: string): CentralEndpointValidation {
  const parsed = parseCentralEndpoint(input);
  if (!parsed.isValid) return parsed;

  const { protocol, hostname } = new URL(parsed.endpoint);
  if (protocol === 'http:' && !isInternalHost(hostname)) {
    return { isValid: false, reason: 'Plain http is only allowed for internal hosts' };
  }
  return parsed;
}

/** Whether `normaliseCentralEndpoint` accepts the endpoint. */
export function isValidCentralEndpoint(input: string): boolean {
  return normaliseCentralEndpoint(input).isValid;
}

/** Drops empty entries, normalises, and removes any endpoint already present at an earlier position. */
export function dedupeCentralEndpoints(endpoints: string[]): string[] {
  const seen = new Set<string>();
  for (const entry of endpoints) {
    const result = normaliseCentralEndpoint(entry);
    if (result.isValid) seen.add(result.endpoint);
  }
  return [...seen];
}
