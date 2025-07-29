import React from 'react';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { useTranslation } from '../../contexts/Translation';
import { useProgramRegistryConditionsQuery } from '../../api/queries';
import {
  AutocompleteField,
  FieldWithTooltip,
} from '../../components';

export const ProgramRegistryConditionField = ({
  name,
  programRegistryId,
  onClear,
  label,
  ariaLabelledby = null,
  optionsFilter = () => true,
}) => {
  const { getTranslation } = useTranslation();
  const { data: conditions } = useProgramRegistryConditionsQuery(programRegistryId);
  const options = conditions?.filter(optionsFilter).map?.(condition => ({
    label: (
      getTranslation(
        getReferenceDataStringId(condition.id, 'programRegistryCondition'),
        condition.name,
      )
    ),
    value: condition.id,
  }));

  const onChange = event => {
    const userClickedClear = !event.target.value;
    if (userClickedClear) {
      onClear();
    }
  };

  return (
    <FieldWithTooltip
      onChange={onChange}
      disabledTooltipText={
        !conditions
          ? getTranslation(
              'programRegistry.relatedConditions.tooltip',
              'Select a program registry to add related conditions',
            )
          : getTranslation(
              'programRegistry.relatedConditions.noConditionsTooltip',
              'No conditions have been configured for this program registry',
            )
      }
      name={name}
      label={label}
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={AutocompleteField}
      options={options}
      disabled={!conditions || conditions.length === 0}
      aria-labelledby={ariaLabelledby}
    />
  );
};
