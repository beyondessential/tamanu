import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../contexts/Translation';
import {
  BaseSelectField,
  FieldWithTooltip,
  TranslatedReferenceData,
  getReferenceDataStringId,
} from '../../components';
import { Colors } from '../../constants';
import { useProgramRegistryConditionCategoriesQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';

const StyledBaseSelectField = styled(BaseSelectField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
  }
`;

export const ProgramRegistryConditionCategoryField = ({
  name,
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
  const options = conditionCategories.map(conditionCategory => ({
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
