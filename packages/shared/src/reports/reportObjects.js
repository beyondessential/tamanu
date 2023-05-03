import { REPORT_DEFINITIONS } from './reportDefinitions';

// The keys are the report IDs, values are objects instances of reports
export const REPORT_OBJECTS = {};

// To check if a user has permissions we need to have an object
// with a constructor name that matches the 'noun' of the permission
// and also the id as a field.
class Report {
  constructor(id) {
    this.id = id;
  }
}

REPORT_DEFINITIONS.forEach(definition => {
  const { id } = definition;
  REPORT_OBJECTS[id] = new Report(id);
});
