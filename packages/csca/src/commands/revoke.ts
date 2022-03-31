import { Command } from 'commander';
import { parseDate } from 'chrono-node';

function run(
  folder: string,
  certificate: string,
  options: { date: string }
) {
  const date = parseDate(options.date);
  date.toISOString(); // throws on invalid date
}

export default new Command('revoke')
  .description('revoke a certificate')
  .argument('folder', 'path to CSCA folder')
  .argument('certificate', 'path to certificate file')
  .option(
    '--date <datetime>',
    'date and/or time of revocation',
    'now',
  )
  .action(run);

// CRL reason extension is explicitly disallowed by 9303-12
