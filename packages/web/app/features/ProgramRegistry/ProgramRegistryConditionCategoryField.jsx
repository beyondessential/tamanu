import React from 'react';
import { CONDITION_CATEGORIES } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { BaseSelectField, FieldWithTooltip, TranslatedText } from '../../components';

const categoryOptions = Object.values(CONDITION_CATEGORIES).map((category) => ({
  label: category,
  value: category,
}));

export const ProgramRegistryConditionCategoryField = ({ name, conditionId }) => {
  const { getTranslation } = useTranslation();
  return (
    <FieldWithTooltip
      disabledTooltipText={!conditionId ? 'Select a condition to add related categories' : ''}
      name={`${name}.category`}
      label={
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditionsCategory.label"
          fallback="Category"
        />
      }
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={BaseSelectField}
      options={categoryOptions}
      disabled={!conditionId}
      required={conditionId}
    />
  );
};
