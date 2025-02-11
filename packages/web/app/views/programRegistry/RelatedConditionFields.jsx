import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../contexts/Translation';
import { useProgramRegistryConditionsQuery } from '../../api/queries';
import {
  ArrayField,
  BaseSelectField,
  Field,
  FieldWithTooltip,
  getReferenceDataStringId,
  TranslatedReferenceData,
  TranslatedText,
} from '../../components';

const ConditionField = ({ name, programRegistryId }) => {
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

  return (
    <FieldWithTooltip
      disabledTooltipText={
        !conditions
          ? 'Select a program registry to add related conditions'
          : 'No conditions have been configured for this program registry'
      }
      name={`${name}.conditionId`}
      label={
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditions.label"
          fallback="Related conditions"
        />
      }
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={BaseSelectField}
      options={options}
      disabled={!conditions || conditions.length === 0}
    />
  );
};

const CategoryField = ({ name, conditionId }) => {
  const { getTranslation } = useTranslation();
  const categoryOptions = [
    'Suspected',
    'Under investigation',
    'Confirmed',
    'Unknown',
    'Disproven',
    'Resolved',
    'In remission',
    'Not applicable',
    'Recorded in error',
  ].map((category) => ({
    label: category,
    value: category,
  }));

  return (
    <FieldWithTooltip
      disabledTooltipText={!conditionId ? 'Select a condition to add related categories' : ''}
      name={`${name}.category`}
      label={
        <TranslatedText
          stringId="patientProgramRegistry.relatedConditions.label"
          fallback="Category"
        />
      }
      placeholder={getTranslation('general.placeholder.select', 'Select')}
      component={BaseSelectField}
      options={categoryOptions}
      disabled={!conditionId}
      required
    />
  );
};

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  grid-column: 1 / -1;
  gap: 10px;

  > div {
    flex: 1;
  }

  > div:first-child {
    min-width: 50%;
  }
`;

export const RelatedConditionFields = ({ programRegistryId, formValues }) => {
  return (
    <Field
      name="conditions"
      component={ArrayField}
      renderField={(index, DeleteButton) => {
        const fieldName = `conditions[${index}]`;
        const conditionValue = formValues?.conditions ? formValues?.conditions[index] : null;
        return (
          <Container>
            <ConditionField name={fieldName} programRegistryId={programRegistryId} />
            <CategoryField name={fieldName} conditionId={conditionValue?.conditionId} />
            {index > 0 && DeleteButton}
          </Container>
        );
      }}
    />
  );
};
