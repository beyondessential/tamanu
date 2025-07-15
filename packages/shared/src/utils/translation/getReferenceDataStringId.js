import slugify from 'slugify';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';


/**
 * Returns the stringId for a reference data option.
* @example getReferenceDataOptionStringId('question1', 'surveyScreenComponent', 'undecided') -> "refData.surveyScreenComponent.detail.question1.option.undecided"
 */
export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${slugify(option)}`;
};

/**
 * Returns the stringId for a reference data value.
 * @example getReferenceDataStringId('O', 'bloodType') -> "refData.bloodType.o"
 */
export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};
