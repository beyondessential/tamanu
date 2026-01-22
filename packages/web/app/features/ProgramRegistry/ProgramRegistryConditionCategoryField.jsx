import React from 'react';
import styled from 'styled-components';

import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { useTranslation } from '../../contexts/Translation';
import { FieldWithTooltip, TranslatedReferenceData } from '../../components';
import { BaseSelectField } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { useProgramRegistryConditionCategoriesQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';

const StyledBaseSelectField = styled(BaseSelectField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
  }
`;

export const ProgramRegistryConditionCategoryField = ({
  name,
  isInitialRegistration,
  programRegistryId,
  label,
  disabled,
  disabledTooltipText,
  required = false,
  ariaLabelledby = null,
}) => {
  const { getTranslation } = useTranslation();
  const { data: conditionCategories = [] } = useProgramRegistryConditionCategoriesQuery(
    programRegistryId,
  );
  const options = conditionCategories
    .filter(conditionCategory => isInitialRegistration
      ? conditionCategory.code !== PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR : true)
    .map(conditionCategory => ({
      label: (
        <TranslatedReferenceData
          fallback={conditionCategory.name}
          value={conditionCategory.id}
          category="programRegistryConditionCategory"
        />
      ),
      value: conditionCategory.id,
      searchString: getTranslation(
        getReferenceDataStringId(conditionCategory.id, 'programRegistryConditionCategory'),
        conditionCategory.name,
      ),
    }));

  return (
    <FieldWithTooltip
      disabledTooltipText={disabled ? disabledTooltipText : ''}
      name={name}
      label={label}
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={StyledBaseSelectField}
      options={options}
      disabled={disabled}
      required={required}
      aria-labelledby={ariaLabelledby}
    />
  );
};
