import { REFERENCE_DATA_TRANSLATION_PREFIX } from "@tamanu/constants";
import { camelCase } from "lodash";

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${camelCase(option)}`;
};