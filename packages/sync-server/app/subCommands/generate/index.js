import { Command } from 'commander';
import { generateFiji } from './fiji';

export const generateCommand = new Command('generate').description('Generate fake data');

generateCommand
  .command('fiji')
  .description('Generate fake data with the same rough structure as Fiji')
  .option('-p, --patientCount <number>', 'number of patients to generate', 10000)
  .action(generateFiji);
