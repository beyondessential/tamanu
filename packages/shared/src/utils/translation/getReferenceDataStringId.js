import { REFERENCE_DATA_TRANSLATION_PREFIX } from "@tamanu/constants";

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

function toCamelCaseWithSpecialCharacters(str) {
  return str.replace(/([^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (match, separator, nextChar) => {
    return separator + nextChar.toUpperCase();
  });
}

export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${toCamelCaseWithSpecialCharacters(option)}`;
};