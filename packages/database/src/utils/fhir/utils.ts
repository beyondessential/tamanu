import { isPlainObject } from 'lodash';

import { VISIBILITY_STATUSES } from '@tamanu/constants';

function mapAndCompactArray(input: object[]): object[] | undefined {
  const compactArray = input
    .map((v) => objectAsFhir(v))
    .filter((v) => v !== null && v !== undefined);
  return compactArray.length === 0 ? undefined : compactArray;
}

export function objectAsFhir(input: object | object[]) {
  if (Array.isArray(input)) {
    return mapAndCompactArray(input);
  }

  if (!isPlainObject(input) || input === null) {
    return input;
  }

  const obj: Record<string, any> = {};
  for (const [name, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      continue;
    } else if (Array.isArray(value)) {
      obj[name] = mapAndCompactArray(value);
    } else if (isPlainObject(value)) {
      obj[name] = objectAsFhir(value);
    } else {
      obj[name] = value;
    }
  }
  return obj;
}

export function activeFromVisibility(upstream: { visibilityStatus?: string; deletedAt?: Date }) {
  switch (upstream.visibilityStatus) {
    case VISIBILITY_STATUSES.CURRENT:
      return !upstream.deletedAt;
    default:
      return false;
  }
}
