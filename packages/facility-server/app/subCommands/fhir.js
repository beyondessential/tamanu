import { Command } from 'commander';
import { createFhirCommand } from '@tamanu/shared/tasks';

import { ApplicationContext } from '../ApplicationContext';

export const fhirCommand = createFhirCommand(Command, ApplicationContext);
