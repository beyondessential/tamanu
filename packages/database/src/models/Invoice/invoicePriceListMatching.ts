import { differenceInYears, parseISO } from 'date-fns';

export const equalsIfPresent = (
  ruleVal: string | undefined,
  inputVal: string | undefined,
): boolean => {
  if (ruleVal == null) {
    return true; // If ruleVal not present, return true
  }
  return ruleVal === inputVal;
};

const OPERATORS: Record<string, (a: number, b: number) => boolean> = {
  '<': (a: number, b: number) => a < b,
  '<=': (a: number, b: number) => a <= b,
  '>': (a: number, b: number) => a > b,
  '>=': (a: number, b: number) => a >= b,
  '=': (a: number, b: number) => a === b,
};

/**
 * @param condition - Age condition string (e.g., ">=18", "<65", "=21")
 * @param dob - patient date of birth as ISO date string (e.g., "2010-10-15")
 */
export const matchesAgeIfPresent = (
  condition: string | undefined,
  dob?: string | null,
): boolean => {
  if (!condition) {
    return true; // If condition not present, return true
  }

  if (!dob) {
    return false;
  }

  const parsedDob = parseISO(dob);
  if (Number.isNaN(parsedDob.getTime())) {
    return false;
  }

  const ageYears = differenceInYears(new Date(), parsedDob);

  const trimmed = condition.trim();
  const match = trimmed.match(/^(<=|>=|<|>|=)\s*(\d{1,3})$/);
  if (!match) return false;
  const [, op, value] = match;
  const operator = OPERATORS[op!]!;
  return operator(ageYears, Number(value));
};
