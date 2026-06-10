import ipaddr from 'ipaddr.js';

/**
 * CIDR matching for the IP policy settings (auth.ipAllowlist,
 * auth.mfa.ipExempt). Handles IPv4, IPv6, and IPv4-mapped-IPv6 (Node reports
 * v4 clients as ::ffff:a.b.c.d on dual-stack sockets) by normalising the
 * client address before comparison.
 *
 * Fail-closed throughout: an unparsable client IP or a malformed CIDR entry
 * never matches — a garbage allowlist entry can't open the door, and a
 * garbage exempt entry can't skip MFA.
 */

const parseClientIp = (ip: unknown): ipaddr.IPv4 | ipaddr.IPv6 | null => {
  if (typeof ip !== 'string' || !ipaddr.isValid(ip)) return null;
  // unwraps IPv4-mapped IPv6 to plain IPv4
  return ipaddr.process(ip);
};

const matchesCidr = (addr: ipaddr.IPv4 | ipaddr.IPv6, cidr: string): boolean => {
  try {
    const [range, bits] = ipaddr.parseCIDR(cidr);
    if (range.kind() !== addr.kind()) return false;
    return (addr as ipaddr.IPv4).match([range as ipaddr.IPv4, bits]);
  } catch (_err) {
    // a malformed entry in the list never matches
    return false;
  }
};

/**
 * Whether the client IP falls inside any of the CIDR ranges. An empty or
 * missing list matches nothing.
 */
export function ipMatchesCidrList(ip: unknown, cidrs: unknown): boolean {
  if (!Array.isArray(cidrs) || cidrs.length === 0) return false;
  const addr = parseClientIp(ip);
  if (!addr) return false;
  return cidrs.some(cidr => typeof cidr === 'string' && matchesCidr(addr, cidr));
}

/**
 * Whether a string is a well-formed CIDR (for settings validation).
 */
export function isValidCidr(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    ipaddr.parseCIDR(value);
    return true;
  } catch (_err) {
    return false;
  }
}

/**
 * Whether a string is a syntactically valid IP address (v4 or v6).
 */
export function isValidIpAddress(value: unknown): boolean {
  return typeof value === 'string' && ipaddr.isValid(value);
}
