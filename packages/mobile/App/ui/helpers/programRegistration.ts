interface RegistrationConditionEntry {
  condition?: { value?: string } | null;
  category?: { value?: string } | null;
}

/**
 * Keep only condition rows that have both a condition and a category selected.
 *
 * The "Add additional" button inserts a blank placeholder row that stays empty if
 * the user backs out of the condition/category picker, and yup's array().of() does
 * not reject it. Saving those incomplete rows throws on condition.condition.value
 * after the registration has already been saved, which blocks navigation and, on
 * re-submit, duplicates the conditions saved before the crash.
 */
export const getCompleteRegistrationConditions = <T extends RegistrationConditionEntry>(
  conditions?: T[] | null,
): T[] => (conditions ?? []).filter(entry => Boolean(entry?.condition?.value && entry?.category?.value));
