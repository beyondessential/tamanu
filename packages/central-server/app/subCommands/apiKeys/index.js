import { Command } from 'commander';
import { issueCommand } from './issue';

export const apiKeysCommand = new Command('apiKeys').description('Manage API keys');
apiKeysCommand.addCommand(issueCommand);
