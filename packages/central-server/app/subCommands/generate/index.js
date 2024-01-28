import { Command } from 'commander';
import { fijiCommand } from './fiji';
import { fakeCommand } from './fake';

export const generateCommand = new Command('generate').description('Generate fake data');
generateCommand.addCommand(fijiCommand);
generateCommand.addCommand(fakeCommand);
