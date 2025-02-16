import React from 'react';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedSelectField, FieldWithTooltip, TranslatedText } from '../../components';

export const ProgramRegistryConditionCategoryField = ({ name, conditionId }) => {
  const { getTranslation } = useTranslation();
  return (
    <FieldWithTooltip
      disabledTooltipText={
        !conditionId
          ? getTranslation(
              'patientProgramRegistry.relatedConditionsCategory.tooltip',
              'Select a condition to add related categories',
            )
          : ''
      }
      name={`${name}.category`}
      label={
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditionsCategory.label"
          fallback="Category"
        />
      }
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={TranslatedSelectField}
      enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORIES}
      disabled={!conditionId}
      required={conditionId}
    />
  );
};
