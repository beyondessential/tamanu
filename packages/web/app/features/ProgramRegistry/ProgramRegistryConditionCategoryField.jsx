import React from 'react';
import styled from 'styled-components';
import { PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';
import { TranslatedSelectField, FieldWithTooltip } from '../../components';
import { Colors } from '../../constants';

const SelectField = styled(TranslatedSelectField)`
  .Mui-disabled {
    background-color: ${Colors.hoverGrey};
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
      component={SelectField}
      enumValues={PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS}
      disabled={disabled}
      required={required}
      aria-labelledby={ariaLabelledby}
    />
  );
};
