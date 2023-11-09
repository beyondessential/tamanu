import { program } from 'commander';

import { version } from '../package.json';
import { create, crlUpload, reconfig, revoke, sign } from './commands';

program
  .version(version)
  .description('Tamanu CSCA Tooling')
  .addCommand(create)
  .addCommand(sign)
  .addCommand(crlUpload)
  .addCommand(reconfig)
  .addCommand(revoke)
  .parseAsync(process.argv)
  .catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
