import React from 'react';
import styled from 'styled-components';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedSelectField, FieldWithTooltip } from '../../components';

const StyledTextField = styled(TranslatedSelectField)`
  .Mui-disabled {
    background-color: #f3f5f7;
  }
`;

export const ProgramRegistryConditionCategoryField = ({
  label,
  name,
  disabled,
  disabledTooltipText,
  required = false,
  ariaLabelledby = null,
}) => {
  const { getTranslation } = useTranslation();
  return (
    <FieldWithTooltip
      disabledTooltipText={disabled ? disabledTooltipText : ''}
      name={name}
      label={label}
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={StyledTextField}
      enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORIES}
      disabled={disabled}
      required={required}
      aria-labelledby={ariaLabelledby}
    />
  );
};
