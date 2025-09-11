import { InvalidParameterError } from '@tamanu/errors';

import { hl7PatientFields, sortableHL7PatientFields } from '../hl7PatientFields';

export function getSortParameterName(sort) {
  return sort[0] === '-' ? sort.slice(1) : sort;
}

export function hl7SortToTamanu(hl7Sort, modelName) {
  // Sorts are a comma separated list of parameters
  const sorts = hl7Sort.split(',');

  // Create list of Tamanu sorts
  const tamanuSorts = sorts.map(sort => {
    // Allow a "-" at the beginning to reverse sort
    const parameter = getSortParameterName(sort);
    const direction = sort[0] === '-' ? 'DESC' : 'ASC';

    // Base parameters
    if (parameter === 'issued') return ['createdAt', direction];

    // Parse patient parameters
    if (modelName === 'Patient') {
      if (sortableHL7PatientFields.includes(parameter)) {
        const { fieldName, sortArguments } = hl7PatientFields[parameter];
        const args = sortArguments || [fieldName];
        return [...args, direction];
      }
    }
    // Something went terribly wrong
    throw new InvalidParameterError(`Unrecognised sort parameter in: ${hl7Sort}`);
  });

  // Always sort by descending ID last
  tamanuSorts.push(['id', 'DESC']);

  return tamanuSorts;
}
