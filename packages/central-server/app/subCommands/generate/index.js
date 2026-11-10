import { Command } from 'commander';
import { fijiCommand } from './fiji';
import { kioskDemoCommand } from './kioskDemo';
import { seedCommand } from './seed';

export const generateCommand = new Command('generate').description('Generate fake data');
generateCommand.addCommand(fijiCommand);
generateCommand.addCommand(seedCommand);
generateCommand.addCommand(kioskDemoCommand);
