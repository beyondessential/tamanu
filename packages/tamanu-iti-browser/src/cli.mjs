import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { candidates } from './discovery.mjs';
import { connectFacility } from './agent.mjs';
import { stablePort } from './origin.mjs';
import { launchApp } from './launch.mjs';

/**
 * Prototype entry point for a real desktop.
 *
 *   node src/cli.mjs --facility <uuid> --host <uuid>.facility.internal \
 *                    --ca <ca.pem> --candidate <ip:port> [--candidate <ip:port> ...]
 *
 * Verifies a candidate against the BES CA, starts the loopback proxy on a
 * stable per-facility port, and opens the user's Chrome in app mode at the
 * loopback origin.
 */
function parseArgs(argv) {
  const args = { candidate: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1];
    if (key === 'candidate') args.candidate.push(value);
    else args[key] = value;
    i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.facility || !args.host || !args.ca || args.candidate.length === 0) {
  console.error('usage: node src/cli.mjs --facility <uuid> --host <san> --ca <ca.pem> --candidate <ip:port> [...]');
  process.exit(2);
}

// Parse "<host>:<port>", supporting bracketed IPv6 ("[::1]:8443") — a plain
// split(':') would mangle IPv6 addresses.
function parseCandidate(value) {
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    return { address: value.slice(1, end), port: Number(value.slice(end + 2)) };
  }
  const colon = value.lastIndexOf(':');
  return { address: value.slice(0, colon), port: Number(value.slice(colon + 1)) };
}

const stateDir = path.join(os.homedir(), '.tamanu-iti-browser');
const caPem = fs.readFileSync(args.ca);
const explicit = args.candidate.map(parseCandidate);

const listenPort = await stablePort(args.facility, path.join(stateDir, 'ports.json'));
const { origin } = await connectFacility({
  facilityId: args.facility,
  host: args.host,
  caPem,
  candidates: candidates({ explicit }),
  listenPort,
});

console.log(`facility trusted; loopback origin: ${origin}`);
const userDataDir = path.join(stateDir, 'profiles', args.facility);
fs.mkdirSync(userDataDir, { recursive: true });
launchApp(origin, { userDataDir });
console.log('launched Chrome in app mode');
