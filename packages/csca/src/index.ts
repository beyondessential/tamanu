import { program } from 'commander';

import { version } from '../package.json';
import { create, sign, crlUpload, revoke } from './commands';

process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';

program
  .version(version)
  .description('Tamanu CSCA Tooling')
  .addCommand(create)
  .addCommand(sign)
  .addCommand(crlUpload)
  .addCommand(revoke)
  .parseAsync(process.argv)
  .catch(e => {
    console.error(e.stack);
    process.exit(1);
  });
