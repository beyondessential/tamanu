import React from 'react';
import { useTranslation } from '../../contexts/Translation';
import { useProgramRegistryConditionsQuery } from '../../api/queries';
import {
  BaseSelectField,
  FieldWithTooltip,
  getReferenceDataStringId,
  TranslatedReferenceData,
  TranslatedText,
} from '../../components';

export const ProgramRegistryConditionField = ({ name, programRegistryId, onClear }) => {
  const { getTranslation } = useTranslation();
  const { data: conditions } = useProgramRegistryConditionsQuery(programRegistryId);
  const options = conditions?.map?.((condition) => ({
    label: (
      <TranslatedReferenceData
        fallback={condition.name}
        value={condition.id}
        category="condition"
      />
    ),
    value: condition.id,
    searchString: getTranslation(
      getReferenceDataStringId(condition.id, 'condition'),
      condition.name,
    ),
  }));

  const onChange = (event) => {
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
          ? 'Select a program registry to add related conditions'
          : 'No conditions have been configured for this program registry'
      }
      name={`${name}.conditionId`}
      label={
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditions.label"
          fallback="Related condition"
        />
      }
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={BaseSelectField}
      options={options}
      disabled={!conditions || conditions.length === 0}
    />
  );
};
