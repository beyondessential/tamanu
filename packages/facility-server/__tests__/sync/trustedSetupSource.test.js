import { isTrustedSetupSource } from '../../app/routes/apiv1/setup';

describe('isTrustedSetupSource', () => {
  it.each([
    ['127.0.0.1', 'IPv4 loopback'],
    ['::1', 'IPv6 loopback'],
    ['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
    ['10.1.2.3', 'RFC1918 10/8'],
    ['172.16.5.5', 'RFC1918 172.16/12'],
    ['192.168.0.5', 'RFC1918 192.168/16'],
    ['169.254.1.1', 'link-local'],
    ['100.96.1.1', 'Tailscale CGNAT 100.64/10'],
    ['fd7a:115c:a1e0::1', 'Tailscale ULA'],
    ['fe80::1', 'IPv6 link-local'],
  ])('trusts %s (%s)', ip => {
    expect(isTrustedSetupSource(ip)).toBe(true);
  });

  it.each([
    ['8.8.8.8', 'public IPv4'],
    ['172.32.0.1', 'just outside 172.16/12'],
    ['2001:4860:4860::8888', 'public IPv6'],
    ['', 'empty'],
    [undefined, 'undefined'],
    ['not-an-ip', 'garbage'],
  ])('rejects %s (%s)', ip => {
    expect(isTrustedSetupSource(ip)).toBe(false);
  });
});
