import React from 'react';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedSelectField, FieldWithTooltip } from '../../components';

export const ProgramRegistryConditionCategoryField = ({
  label,
  name,
  conditionId,
  required = false,
  ariaLabelledby = null,
}) => {
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
      name={name}
      label={label}
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={TranslatedSelectField}
      enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORIES}
      disabled={!conditionId}
      required={required}
      ariaLabelledby={ariaLabelledby}
    />
  );
};
