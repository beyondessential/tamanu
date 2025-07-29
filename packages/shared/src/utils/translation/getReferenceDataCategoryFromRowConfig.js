import { camelCase } from 'lodash';

export const getReferenceDataCategoryFromRowConfig = configString => {
  try {
    const config = JSON.parse(configString);
    // Special handling for icd10, which is the legacy code for diagnosis
    const type = config.where?.type === 'icd10' ? 'diagnosis' : config.where?.type;
    return camelCase(config.source === 'ReferenceData' ? type : config.source);
  } catch (e) {
    return null;
  }
};
