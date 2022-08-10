import { Command } from 'commander';
import { fijiCommand } from './fiji';

export const generateCommand = new Command('generate').description('Generate fake data');
generateCommand.addCommand(fijiCommand);
