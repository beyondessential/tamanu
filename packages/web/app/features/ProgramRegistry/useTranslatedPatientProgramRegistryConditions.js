import { PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS } from '@tamanu/constants';
import { sortBy } from 'lodash';
import { useTranslation } from '../../contexts/Translation';
import { getReferenceDataStringId } from '../../components';

export const useTranslatedPatientProgramRegistryConditions = (conditionsData = []) => {
  const { getTranslation, getEnumTranslation } = useTranslation();

  const translatedData = conditionsData.map(condition => {
    const { programRegistryCondition, conditionCategory } = condition;
    const { id, name } = programRegistryCondition;
    const translatedName = getTranslation(getReferenceDataStringId(id, 'condition'), name);

    const translatedCategory = getEnumTranslation(
      PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
      conditionCategory,
    );
    return { ...condition, translatedName, translatedCategory };
  });
  return sortBy(translatedData, c => c.translatedName);
};
