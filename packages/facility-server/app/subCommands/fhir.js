import { createFhirCommand } from '@tamanu/shared/tasks';

import { ApplicationContext } from '../ApplicationContext';

export const fhirCommand = createFhirCommand(ApplicationContext);
