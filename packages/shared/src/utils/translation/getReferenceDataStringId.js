import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

/**
 * Replace any spaces, dots, and semicolons with underscores (dots are the delimiter in translation ids, and semicolons are invalid)
 *
 * @example "hello world" → "hello_world"
 * @example "test.value" → "test_value"
 * @example "hello.world test" → "hello_world_test"
 * @example "hello;world test" → "hello_world_test"
 */
const formatOptionForStringId = str => `${str}`.replace(/[\s.;]/g, '_');

/**
 * Returns the stringId for a reference data option.
 * @example getReferenceDataOptionStringId('question1', 'surveyScreenComponent', 'undecided') -> "refData.surveyScreenComponent.detail.question1.option.undecided"
 */
export const getReferenceDataOptionStringId = (value, category, option) => {
  const baseStringId = `${getReferenceDataStringId(value, category)}.option`;
  return `${baseStringId}.${formatOptionForStringId(option)}`;
};

/**
 * Returns the stringId for a reference data value.
 * @example getReferenceDataStringId('O', 'bloodType') -> "refData.bloodType.o"
 */
export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};
