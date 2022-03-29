import { Command } from 'commander';
import { parseDate } from 'chrono-node';
import { enumFromStringValue, enumValues } from '../utils';

export enum Reasons {
  Unspecified = 'unspecified',
  KeyCompromise = 'keyCompromise',
  CaCompromise = 'CACompromise',
  AffiliationChanged = 'affiliationChanged',
  Superseded = 'superseded',
  CessationOfOperation = 'cessationOfOperation',
}

function run(
  folder: string,
  certificate: string,
  options: {
    reason: string;
    compromiseTime: string;
  },
) {
  const reason = enumFromStringValue(Reasons, options.reason);

  let parsedTime: Date;
  if (reason === Reasons.CaCompromise || reason === Reasons.KeyCompromise) {
    parsedTime = parseDate(options.compromiseTime);
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
    `reason for revocation (one of: ${enumValues(Reasons).join(', ')})`,
    'unspecified',
  )
  .option(
    '-T, --compromise-time <datetime>',
    'date and time of compromise for keyCompromise and CACompromise',
    'now',
  )
  .action(run);
