import { REFERENCE_DATA_TRANSLATION_PREFIX } from "@tamanu/constants";

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

function toCamelCaseWithSpecialCharacters(str) {
  return str
    .split(/([^a-zA-Z0-9]+)/)
    .map((word, index) => {
      if (index === 0 || /[^a-zA-Z0-9]/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${toCamelCaseWithSpecialCharacters(option)}`;
};