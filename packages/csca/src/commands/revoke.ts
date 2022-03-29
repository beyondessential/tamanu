import { Command } from 'commander';
import { parseDate } from 'chrono-node';

const REASONS = [
  'unspecified',
  'keyCompromise',
  'CACompromise',
  'affiliationChanged',
  'superseded',
  'cessationOfOperation',
];

function run(
  folder: string,
  certificate: string,
  options: {
    reason: string;
    compromiseTime: string;
  },
) {
  const { reason, compromiseTime } = options;
  let parsedTime: Date;

  if (!REASONS.includes(reason)) throw new Error('Invalid reason');
  if (reason === 'keyCompromise' || reason === 'CACompromise') {
    parsedTime = parseDate(compromiseTime);
    parsedTime.toISOString(); // throws on invalid date
  }

  //
}

export default new Command('revoke')
  .description('revoke a certificate')
  .argument('folder', 'path to CSCA folder')
  .argument('certificate', 'path to certificate file')
  .option(
    '-R, --reason <reason>',
    `reason for revocation (one of: ${REASONS.join(', ')})`,
    'unspecified',
  )
  .option(
    '-T, --compromise-time <datetime>',
    'date and time of compromise for keyCompromise and CACompromise',
    'now',
  )
  .action(run);
