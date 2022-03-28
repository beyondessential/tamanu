import { Command } from 'commander';

import create from './create';

export default new Command('csca')
  .description('manage a csca')
  .addCommand(create);
