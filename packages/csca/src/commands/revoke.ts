import { Command } from 'commander';
import { parseDate } from 'chrono-node';

function run(
  folder: string,
  certificate: string,
  options: { date: string, serial: boolean }
) {
  const date = parseDate(options.date);
  date.toISOString(); // throws on invalid date

  // open CA read-only
  // check integrity

  // if not serial:
    // read serial from cert
    // load CA public key
    // check cert signature

  // now we have a serial
  // read CA index, find serial
  // if already revoked, tell user and exit

  // otherwise, prompt
  // re-open CA read-write
  // revoke cert:
    // write to index
    // write to log

  // prompt for updating CRL
    // if so, essentially call crl-upload
}

export default new Command('revoke')
  .description('revoke a certificate')
  .argument('folder', 'path to CSCA folder')
  .argument('certificate', 'path to certificate file')
  .option(
    '--serial',
    'interpret the <certificate> input as a serial number',
  )
  .option(
    '--date <datetime>',
    'date and/or time of revocation',
    'now',
  )
  .action(run);

// CRL reason extension is explicitly disallowed by 9303-12
